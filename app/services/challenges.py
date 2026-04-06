from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.challenges import (
    ChallengeCompleteResponse,
    ChallengeJoinResponse,
    ChallengeLogResponse,
    ChallengeResponse,
    UserChallengeResponse,
)
from app.models.challenges import Challenge, UserChallenge
from app.models.users import User
from app.repositories.challenge_repository import (
    ChallengeLogRepository,
    ChallengeRepository,
    UserChallengeRepository,
)
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.repositories.prediction_repository import PredictionRepository

_MOTIVATION_MESSAGES = [
    "잘 하고 있어요! 계속 유지하세요.",
    "오늘도 한 걸음 더 나아갔어요!",
    "꾸준함이 건강을 만들어요.",
    "작은 습관이 큰 변화를 만들어요!",
]

_IMPROVEMENT_MESSAGES = {
    "운동": "규칙적인 운동은 지방간 위험을 최대 30% 줄여줄 수 있어요.",
    "식단": "균형 잡힌 식단은 간 건강 개선에 직접적으로 도움이 돼요.",
    "금주": "금주는 간 지방 축적을 빠르게 줄여줄 수 있어요.",
}


def _calc_grade(score: float) -> str:
    if score >= 80:
        return "정상"
    elif score >= 55:
        return "경미"
    elif score >= 30:
        return "중등도"
    else:
        return "중증"


def _get_recommended_challenge_ids(shap_factors: list) -> list[str]:
    """SHAP 요인에서 상위 feature 반환"""
    return [f["feature"] for f in shap_factors] if shap_factors else []


class ChallengeService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.repo = ChallengeRepository(session)
        self.uc_repo = UserChallengeRepository(session)
        self.log_repo = ChallengeLogRepository(session)
        self.prediction_repo = PredictionRepository(session)
        self.survey_repo = HealthSurveyRepository(session)

    async def get_challenges(self, user: User) -> list[ChallengeResponse]:
        challenges = await self.repo.get_all()

        # 최근 예측의 SHAP 요인으로 추천 챌린지 판단
        latest = await self.prediction_repo.get_latest_by_user_id(user.id)
        recommended_features = _get_recommended_challenge_ids(
            latest.shap_factors if latest else []
        )

        result = []
        for c in challenges:
            is_recommended = c.shap_feature in recommended_features if c.shap_feature else False
            resp = ChallengeResponse.model_validate(c)
            resp.is_recommended = is_recommended
            result.append(resp)

        return result

    async def join_challenge(self, user: User, challenge_id: int) -> ChallengeJoinResponse:
        challenge = await self.repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="챌린지를 찾을 수 없습니다.")

        existing = await self.uc_repo.get_active_by_user_and_challenge(user.id, challenge_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 진행 중인 챌린지입니다.")

        uc = await self.uc_repo.create(user.id, challenge_id)
        return ChallengeJoinResponse(detail="챌린지에 참여하였습니다.", user_challenge_id=uc.id)

    async def get_my_challenges(self, user: User, status_filter: str | None) -> list[UserChallengeResponse]:
        ucs = await self.uc_repo.get_by_user_id(user.id, status_filter)
        return [
            UserChallengeResponse(
                user_challenge_id=uc.id,
                challenge_name=uc.challenge.name,
                type=uc.challenge.type,
                status=uc.status,
                joined_at=uc.joined_at,
                completed_at=uc.completed_at,
            )
            for uc in ucs
        ]

    async def complete_challenge(self, user: User, user_challenge_id: int) -> ChallengeCompleteResponse:
        uc = await self.uc_repo.get_by_id_and_user(user_challenge_id, user.id)
        if not uc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 챌린지를 찾을 수 없습니다.")
        if uc.status == "완료":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 완료된 챌린지입니다.")

        completed_logs = await self.log_repo.count_completed(user_challenge_id)
        if completed_logs < uc.challenge.required_logs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"완료 조건 미달: {completed_logs}/{uc.challenge.required_logs}일 달성",
            )

        latest = await self.prediction_repo.get_latest_by_user_id(user.id)
        score_before = latest.score if latest else 0.0

        await self.uc_repo.update(uc, {"status": "완료", "completed_at": datetime.now()})

        # 챌린지 완료 후 설문 자동 업데이트 (운동 챌린지 예시)
        survey_changes = None
        survey = await self.survey_repo.get_by_user_id(user.id)
        if survey and uc.challenge.shap_feature == "주당운동횟수":
            before_val = survey.weekly_exercise_count
            new_val = min(before_val + 1, 7)
            await self.survey_repo.update(survey, {"weekly_exercise_count": new_val, "exercise": "운동함"})
            survey_changes = {"field": "weekly_exercise_count", "before": before_val, "after": new_val}

        # 새 점수 계산
        from app.services.health_surveys import _calc_score_from_survey, _calc_grade as _grade
        updated_survey = await self.survey_repo.get_by_user_id(user.id)
        new_score = float(_calc_score_from_survey(updated_survey)) if updated_survey else score_before
        new_grade = _grade(int(new_score))

        return ChallengeCompleteResponse(
            detail="챌린지를 완료하였습니다.",
            score_before=score_before,
            new_score=new_score,
            new_grade=new_grade,
            survey_changes=survey_changes,
        )

    async def add_log(self, user: User, user_challenge_id: int, is_completed: bool) -> ChallengeLogResponse:
        uc = await self.uc_repo.get_by_id_and_user(user_challenge_id, user.id)
        if not uc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 챌린지를 찾을 수 없습니다.")

        existing = await self.log_repo.get_today_log(user_challenge_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="오늘 이미 기록하였습니다.")

        log = await self.log_repo.create(user_challenge_id, is_completed)

        completed_logs = await self.log_repo.count_completed(user_challenge_id)
        days_remaining = max(0, uc.challenge.required_logs - completed_logs)

        motivation = _MOTIVATION_MESSAGES[completed_logs % len(_MOTIVATION_MESSAGES)]
        improvement = _IMPROVEMENT_MESSAGES.get(uc.challenge.type, "꾸준한 실천이 건강을 만들어요.")

        return ChallengeLogResponse(
            detail="기록이 저장됐습니다.",
            log_date=log.log_date,
            days_remaining=days_remaining,
            motivation_message=motivation,
            expected_improvement=improvement,
        )
