"""seed default challenges

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-04-13

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "e2f3a4b5c6d7"
down_revision: str | None = "d1e2f3a4b5c6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEFAULT_CHALLENGES = [
    # 운동
    ("운동", "주 3회 유산소", "유산소 운동을 주 3회 이상 7일간 실천하세요. 규칙적인 운동은 지방간 위험을 최대 30% 줄여줘요.", 7, 7, "주당운동일수"),
    ("운동", "매일 만보 걷기", "매일 만보(약 8km)를 14일간 걸어보세요. 꾸준한 걷기는 내장지방 감소에 효과적이에요.", 14, 14, "주당운동일수"),
    # 식단
    ("식단", "7일 채소 식단", "매일 채소 반찬 2가지 이상 포함한 식단을 7일간 실천하세요. 식이섬유가 간 지방 축적을 줄여줘요.", 7, 7, "식습관점수"),
    ("식단", "14일 균형 식단", "2주간 과식·야식·패스트푸드를 자제하고 균형 잡힌 식단을 유지하세요.", 14, 10, "식습관점수"),
    # 식습관
    ("식습관", "7일 소식(小食) 챌린지", "일주일간 과식 없이 적절한 양만 먹어보세요. 칼로리 조절은 지방간 개선의 핵심이에요.", 7, 7, "식습관점수"),
    ("식습관", "14일 야식 끊기", "2주간 밤 9시 이후 음식 섭취를 자제하세요. 야식은 간에 지방을 쌓는 주요 원인이에요.", 14, 12, "식습관점수"),
    # 수면
    ("수면", "규칙적인 수면 습관", "7일간 매일 7시간 이상, 일정한 시간에 자고 일어나세요. 충분한 수면은 간 기능 회복을 돕습니다.", 7, 7, "수면시간"),
    ("수면", "수면 환경 개선", "2주간 취침 환경을 개선하고 숙면을 실천하세요. 수면의 질이 간 건강에 직접 영향을 미쳐요.", 14, 12, "수면시간"),
    # 체중감량
    ("체중감량", "2kg 감량 도전", "30일간 식단 조절과 운동으로 2kg을 감량하세요. 체중 감소는 지방간 개선에 가장 직접적인 방법이에요.", 30, 20, "BMI"),
    ("체중감량", "5kg 감량 도전", "60일간 꾸준한 생활습관 개선으로 5kg을 감량하세요. 체중의 5~10% 감량만으로도 간 지방이 크게 줄어요.", 60, 40, "BMI"),
    # 금주
    ("금주", "7일 금주 챌린지", "일주일간 술을 끊어보세요. 단 7일의 금주만으로도 간 수치가 눈에 띄게 개선될 수 있어요.", 7, 7, "음주여부"),
    ("금주", "21일 금주 챌린지", "3주간 금주를 실천하세요. 21일이면 간의 지방 수치가 크게 떨어져요.", 21, 21, "음주여부"),
    ("금주", "30일 금주 마스터", "한 달 완전 금주에 도전하세요. 완료 후 금주 유지 모드로 회복 점수를 계속 쌓을 수 있어요.", 30, 30, "음주여부"),
    # 금연
    ("금연", "14일 금연 챌린지", "2주간 담배를 끊어보세요. 금연은 간 건강뿐 아니라 전신 건강에 즉각적인 효과가 있어요.", 14, 14, "흡연여부"),
    ("금연", "30일 금연 마스터", "한 달 금연에 성공하면 과거흡연자로 전환돼요. 유지 모드로 계속 건강을 지켜보세요.", 30, 30, "흡연여부"),
]


def upgrade() -> None:
    challenges_table = sa.table(
        "challenges",
        sa.column("type", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("duration_days", sa.Integer),
        sa.column("required_logs", sa.Integer),
        sa.column("shap_feature", sa.String),
    )
    op.bulk_insert(
        challenges_table,
        [
            {
                "type": t,
                "name": n,
                "description": d,
                "duration_days": dur,
                "required_logs": req,
                "shap_feature": shap,
            }
            for t, n, d, dur, req, shap in DEFAULT_CHALLENGES
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM challenges WHERE name IN (%s)" % ",".join(
        f"'{n}'" for _, n, *_ in DEFAULT_CHALLENGES
    ))
