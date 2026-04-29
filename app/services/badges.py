import json
from datetime import datetime

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.repositories.badge_repository import BadgeRepository
from app.repositories.challenge_repository import ChallengeLogRepository, UserChallengeRepository

# 전체 뱃지 정의
BADGE_DEFINITIONS = [
    {
        "key": "first_step",
        "name": "첫 걸음",
        "description": "첫 챌린지 참여",
        "emoji": "🎯",
        "tags": ["챌린지", "시작"],
    },
    {"key": "streak_7", "name": "1주 연속", "description": "7일 연속 달성", "emoji": "🔥", "tags": ["연속달성"]},
    {"key": "streak_14", "name": "2주 연속", "description": "14일 연속 달성", "emoji": "⭐", "tags": ["연속달성"]},
    {"key": "streak_30", "name": "1개월 달성", "description": "30일 연속 달성", "emoji": "🏆", "tags": ["연속달성"]},
    {"key": "streak_100", "name": "레전드", "description": "100일 연속 달성", "emoji": "🌟", "tags": ["연속달성"]},
    {
        "key": "perfect_week",
        "name": "완벽한 주",
        "description": "일주일 달성률 100%",
        "emoji": "💎",
        "tags": ["달성률"],
    },
    {
        "key": "exercise_5",
        "name": "운동 마니아",
        "description": "운동 챌린지 5개 완료",
        "emoji": "💪",
        "tags": ["운동"],
    },
    {
        "key": "diet_complete",
        "name": "식습관 마스터",
        "description": "식습관 챌린지 완료",
        "emoji": "🥗",
        "tags": ["식단"],
    },
    {
        "key": "alcohol_complete",
        "name": "금주 챌린지",
        "description": "금주 챌린지 완료",
        "emoji": "🏅",
        "tags": ["금주"],
    },
]

BADGE_MAP = {b["key"]: b for b in BADGE_DEFINITIONS}


class BadgeService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.badge_repo = BadgeRepository(session)
        self.uc_repo = UserChallengeRepository(session)
        self.log_repo = ChallengeLogRepository(session)

    async def get_my_badges(self, user_id: int) -> list[dict]:
        earned = await self.badge_repo.get_by_user(user_id)
        earned_keys = {b.badge_key for b in earned}
        earned_at_map = {b.badge_key: b.earned_at for b in earned}

        # 정적 뱃지
        result = [
            {
                **defn,
                "earned": defn["key"] in earned_keys,
                "earned_at": earned_at_map.get(defn["key"]),
            }
            for defn in BADGE_DEFINITIONS
        ]

        # AI 동적 뱃지 (badge_key가 "ai_generated_"로 시작하는 것)
        for badge in earned:
            if badge.badge_key.startswith("ai_generated_"):
                # badge_key 형식: "ai_generated_{challenge_type}_{timestamp}"
                suffix = badge.badge_key[len("ai_generated_") :]
                parts = suffix.rsplit("_", 1)
                challenge_type = parts[0] if len(parts) == 2 and not parts[0].isdigit() else None
                tags = [challenge_type] if challenge_type else []
                result.append(
                    {
                        "key": badge.badge_key,
                        "name": badge.badge_name or "특별 뱃지",
                        "description": badge.badge_description or "",
                        "emoji": badge.badge_emoji or "🏆",
                        "tags": tags,
                        "earned": True,
                        "earned_at": badge.earned_at,
                    }
                )

        return result

    async def get_earned_count(self, user_id: int) -> int:
        return await self.badge_repo.count_earned(user_id)

    async def evaluate_and_grant(self, user_id: int) -> list[str]:
        """챌린지 로그/완료 후 호출 — 새로 획득한 뱃지 key 목록 반환"""
        newly_granted: list[str] = []

        active_ucs = await self.uc_repo.get_by_user_id(user_id, status="진행중")
        all_ucs = await self.uc_repo.get_by_user_id(user_id)
        active_uc_ids = [uc.id for uc in active_ucs]

        # 첫 챌린지 참여
        if len(all_ucs) >= 1:
            newly_granted += await self._grant_if_new(user_id, "first_step")

        # 연속 달성일
        streak = await self.log_repo.get_streak_days(active_uc_ids)
        for key, threshold in [("streak_7", 7), ("streak_14", 14), ("streak_30", 30), ("streak_100", 100)]:
            if streak >= threshold:
                newly_granted += await self._grant_if_new(user_id, key)

        # 완벽한 주 (이번 주 달성률 100%)
        weekly_rate = await self.log_repo.get_weekly_rate(active_uc_ids)
        if weekly_rate >= 100:
            newly_granted += await self._grant_if_new(user_id, "perfect_week")

        # 운동 챌린지 5개 완료
        completed_exercise = sum(1 for uc in all_ucs if uc.status == "완료" and uc.challenge.type == "운동")
        if completed_exercise >= 5:
            newly_granted += await self._grant_if_new(user_id, "exercise_5")

        # 식습관 챌린지 완료
        completed_diet = any(uc.status == "완료" and uc.challenge.type in ("식단", "식습관") for uc in all_ucs)
        if completed_diet:
            newly_granted += await self._grant_if_new(user_id, "diet_complete")

        # 금주 챌린지 완료
        completed_alcohol = any(uc.status == "완료" and uc.challenge.type == "금주" for uc in all_ucs)
        if completed_alcohol:
            newly_granted += await self._grant_if_new(user_id, "alcohol_complete")

        return newly_granted

    async def grant_ai_badge(
        self,
        user_id: int,
        challenge_name: str,
        challenge_type: str,
        duration_days: int,
        completed_at: datetime,
    ) -> dict | None:
        """챌린지 완료 시 LLM으로 고유 뱃지 생성 (1회성, 캐싱 없음)"""
        badge_key = f"ai_generated_{challenge_type}_{int(completed_at.timestamp())}"

        client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        prompt = f"""당신은 건강 관리 앱의 뱃지 디자이너입니다.
아래 챌린지를 완료한 사용자에게 줄 특별한 뱃지를 만들어주세요.

- 챌린지 이름: {challenge_name}
- 종류: {challenge_type}
- 기간: {duration_days}일
- 완료일: {completed_at.strftime("%Y-%m-%d")}

반드시 아래 JSON 형식으로만 응답하세요.
{{
  "name": "뱃지 이름 (15자 이내)",
  "description": "뱃지 설명 (30자 이내)",
  "emoji": "어울리는 이모지 1개"
}}"""

        try:
            resp = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
            )
            text = resp.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
            badge = await self.badge_repo.grant_ai_badge(
                user_id=user_id,
                badge_key=badge_key,
                name=data.get("name", challenge_name + " 완료"),
                description=data.get("description", f"{duration_days}일 챌린지 달성"),
                emoji=data.get("emoji", "🏆"),
            )
            return {
                "key": badge.badge_key,
                "name": badge.badge_name,
                "description": badge.badge_description,
                "emoji": badge.badge_emoji,
            }
        except Exception:
            return None

    async def _grant_if_new(self, user_id: int, badge_key: str) -> list[str]:
        if not await self.badge_repo.exists(user_id, badge_key):
            await self.badge_repo.grant(user_id, badge_key)
            return [badge_key]
        return []
