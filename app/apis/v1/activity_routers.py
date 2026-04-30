import csv
import io
import os
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import ORJSONResponse as Response
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.activity import ActivityResponse
from app.models.users import User
from app.repositories.daily_health_log_repository import DailyHealthLogRepository
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.services.activity import ActivityService

activity_router = APIRouter(prefix="/activity", tags=["activity"])

FONT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "fonts", "NanumGothic.ttf")


def get_activity_service(db: Annotated[AsyncSession, Depends(get_db)]) -> ActivityService:
    return ActivityService(db)


@activity_router.get("/me", response_model=ActivityResponse, status_code=status.HTTP_200_OK)
async def get_my_activity(
    user: Annotated[User, Depends(get_request_user)],
    activity_service: Annotated[ActivityService, Depends(get_activity_service)],
    limit: int = Query(default=20, le=100),
) -> Response:
    result = await activity_service.get_my_activity(user.id, limit)
    return Response(result.model_dump(), status_code=status.HTTP_200_OK)


@activity_router.get("/report", status_code=status.HTTP_200_OK)
async def download_activity_report(
    user: Annotated[User, Depends(get_request_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    activity_service: Annotated[ActivityService, Depends(get_activity_service)],
    format: str = Query(default="pdf", pattern="^(csv|pdf)$"),
) -> StreamingResponse:
    result = await activity_service.get_my_activity(user.id, limit=1000)
    health_logs = await DailyHealthLogRepository(db).get_all_by_user(user.id)
    survey = await HealthSurveyRepository(db).get_by_user_id(user.id)

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["구분", "항목", "값", "일시"])
        for p in result.predictions:
            writer.writerow(
                ["예측", f"점수: {p.score} / 등급: {p.grade}", "", p.created_at.strftime("%Y-%m-%d %H:%M:%S")]
            )
        for c in result.challenges:
            writer.writerow(["챌린지", c.name, c.status, ""])
        for log in health_logs:
            writer.writerow(
                [
                    "건강로그",
                    log.log_date.strftime("%Y-%m-%d"),
                    f"체중:{log.weight or '-'} 허리:{log.waist or '-'} 수면:{log.sleep_hours or '-'}h 운동:{log.exercise_duration or 0}분 음주:{log.alcohol_amount or 0}잔 흡연:{log.smoking_amount or 0}개",
                    "",
                ]
            )

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="health_report.csv"'},
        )

    # PDF 생성
    try:
        pdf = _build_pdf(user, result, health_logs, survey)
        pdf_bytes = bytes(pdf.output())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"PDF 생성 실패: {e}") from e
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="health_report.pdf"'},
    )


_GRADE_COLOR = {
    "정상": (22, 163, 74),
    "경미": (234, 179, 8),
    "중등도": (249, 115, 22),
    "중증": (220, 38, 38),
}
_STATUS_COLOR = {
    "완료": (22, 163, 74),
    "진행중": (59, 130, 246),
    "포기": (156, 163, 175),
}


def _build_pdf(user, result, health_logs, survey) -> FPDF:
    pdf = FPDF()
    pdf.add_font("Nanum", "", FONT_PATH)
    pdf.add_font("Nanum", "B", FONT_PATH)
    pdf.set_auto_page_break(auto=True, margin=20)

    # ── 표지 헤더 ─────────────────────────────────────
    pdf.add_page()

    # 헤더 배경
    pdf.set_fill_color(16, 185, 129)
    pdf.rect(0, 0, 210, 42, "F")

    # 헤더 우측 장식 삼각형 느낌
    pdf.set_fill_color(5, 150, 105)
    pdf.rect(160, 0, 50, 42, "F")

    pdf.set_font("Nanum", "B", 24)
    pdf.set_text_color(255, 255, 255)
    pdf.set_y(10)
    pdf.cell(0, 12, "건강 리포트", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Nanum", "", 10)
    pdf.set_text_color(209, 250, 229)
    nickname = user.nickname if hasattr(user, "nickname") and user.nickname else ""
    pdf.cell(0, 7, f"{nickname}  ·  {datetime.now().strftime('%Y년 %m월 %d일')}", align="C")

    pdf.set_text_color(0, 0, 0)
    pdf.set_y(52)

    # ── 신체 정보 섹션 ─────────────────────────────────
    if survey:
        _section_title(pdf, "신체 정보")
        rows = [
            ("나이", f"{survey.age}세"),
            ("성별", "남성" if survey.gender == "male" else "여성"),
            ("키", f"{survey.height} cm"),
            ("체중", f"{survey.weight} kg"),
            ("BMI", f"{round(survey.bmi, 1)}"),
            ("허리둘레", f"{survey.waist} cm"),
            ("수면시간", f"{survey.sleep_hours}시간"),
            ("음주", survey.drinking),
            ("운동", survey.exercise),
            ("흡연", survey.smoking),
        ]
        for i, (label, value) in enumerate(rows):
            _info_row(pdf, label, value, i)
        pdf.ln(8)

    # ── 건강 점수 섹션 ─────────────────────────────────
    if result.predictions:
        _section_title(pdf, "건강 점수 이력")
        _table_header(pdf, ["날짜", "점수", "등급"], [90, 45, 45])
        for i, p in enumerate(result.predictions[:10]):
            grade = p.grade
            color = _GRADE_COLOR.get(grade, (60, 60, 60))
            _score_row(pdf, p.created_at.strftime("%Y-%m-%d"), f"{round(p.score)}점", grade, color, i)
        pdf.ln(8)

    # ── 챌린지 섹션 ────────────────────────────────────
    if result.challenges:
        _section_title(pdf, "챌린지 참여 이력")
        _table_header(pdf, ["챌린지명", "유형", "상태"], [95, 40, 45])
        for i, c in enumerate(result.challenges):
            color = _STATUS_COLOR.get(c.status, (100, 100, 100))
            _challenge_row(pdf, c.name, c.type, c.status, color, i)
        pdf.ln(8)

    # ── 건강 로그 섹션 ─────────────────────────────────
    if health_logs:
        _section_title(pdf, "일별 건강 기록")
        _table_header(
            pdf,
            ["날짜", "체중(kg)", "허리(cm)", "수면(h)", "운동(분)", "음주(잔)", "흡연(개)"],
            [36, 26, 26, 22, 26, 26, 28],
        )
        for i, log in enumerate(health_logs):
            _table_row(
                pdf,
                [
                    log.log_date.strftime("%Y-%m-%d"),
                    str(log.weight) if log.weight is not None else "-",
                    str(log.waist) if log.waist is not None else "-",
                    str(log.sleep_hours) if log.sleep_hours is not None else "-",
                    str(log.exercise_duration) if log.exercise_duration else "-",
                    str(log.alcohol_amount) if log.alcohol_amount else "-",
                    str(log.smoking_amount) if log.smoking_amount else "-",
                ],
                [36, 26, 26, 22, 26, 26, 28],
                i,
            )
        pdf.ln(8)

    # ── 푸터 ──────────────────────────────────────────
    pdf.set_font("Nanum", "", 8)
    pdf.set_text_color(180, 180, 180)
    pdf.set_y(-14)
    pdf.set_draw_color(220, 220, 220)
    pdf.set_line_width(0.3)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(2)
    pdf.cell(0, 5, "본 리포트는 간건강 AI 서비스에서 자동 생성되었습니다.", align="C")

    return pdf


def _section_title(pdf: FPDF, title: str) -> None:
    pdf.set_font("Nanum", "B", 12)
    pdf.set_text_color(16, 185, 129)
    # 왼쪽 초록 바
    pdf.set_fill_color(16, 185, 129)
    pdf.rect(10, pdf.get_y() + 1, 3, 7, "F")
    pdf.set_x(15)
    pdf.cell(0, 9, title, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(1)


def _table_header(pdf: FPDF, headers: list[str], widths: list[int]) -> None:
    pdf.set_font("Nanum", "B", 9)
    pdf.set_fill_color(6, 95, 70)
    pdf.set_text_color(255, 255, 255)
    pdf.set_draw_color(6, 95, 70)
    for h, w in zip(headers, widths, strict=False):
        pdf.cell(w, 8, h, border=0, fill=True, align="C")
    pdf.ln()
    pdf.set_text_color(0, 0, 0)
    pdf.set_draw_color(0, 0, 0)


def _info_row(pdf: FPDF, label: str, value: str, idx: int) -> None:
    pdf.set_font("Nanum", "", 9)
    if idx % 2 == 0:
        pdf.set_fill_color(249, 250, 251)
    else:
        pdf.set_fill_color(255, 255, 255)
    pdf.set_draw_color(229, 231, 235)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(55, 7, label, border="TB", fill=True, align="L")
    pdf.set_text_color(17, 24, 39)
    pdf.cell(125, 7, value, border="TB", fill=True, align="L")
    pdf.ln()


def _score_row(pdf: FPDF, date: str, score: str, grade: str, color: tuple, idx: int) -> None:
    pdf.set_font("Nanum", "", 9)
    if idx % 2 == 0:
        pdf.set_fill_color(249, 250, 251)
    else:
        pdf.set_fill_color(255, 255, 255)
    pdf.set_draw_color(229, 231, 235)
    pdf.set_text_color(55, 65, 81)
    pdf.cell(90, 7, date, border="TB", fill=True, align="C")
    pdf.set_font("Nanum", "B", 9)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(45, 7, score, border="TB", fill=True, align="C")
    pdf.set_text_color(*color)
    pdf.cell(45, 7, grade, border="TB", fill=True, align="C")
    pdf.ln()


def _challenge_row(pdf: FPDF, name: str, ctype: str, status: str, color: tuple, idx: int) -> None:
    pdf.set_font("Nanum", "", 9)
    if idx % 2 == 0:
        pdf.set_fill_color(249, 250, 251)
    else:
        pdf.set_fill_color(255, 255, 255)
    pdf.set_draw_color(229, 231, 235)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(95, 7, name, border="TB", fill=True, align="L")
    pdf.set_text_color(107, 114, 128)
    pdf.cell(40, 7, ctype, border="TB", fill=True, align="C")
    pdf.set_font("Nanum", "B", 9)
    pdf.set_text_color(*color)
    pdf.cell(45, 7, status, border="TB", fill=True, align="C")
    pdf.ln()


def _table_row(pdf: FPDF, values: list[str], widths: list[int], idx: int = 0) -> None:
    pdf.set_font("Nanum", "", 9)
    if idx % 2 == 0:
        pdf.set_fill_color(249, 250, 251)
    else:
        pdf.set_fill_color(255, 255, 255)
    pdf.set_draw_color(229, 231, 235)
    pdf.set_text_color(55, 65, 81)
    for v, w in zip(values, widths, strict=False):
        pdf.cell(w, 6, v, border="TB", fill=True, align="C")
    pdf.ln()
