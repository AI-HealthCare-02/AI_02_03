import os
import warnings

import joblib
import numpy as np
import pandas as pd

from ai_worker.main import app

warnings.filterwarnings("ignore", message="X does not have valid feature names")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/fatty_liver_model.pkl")

LABEL_MAP = {0: "정상", 1: "경미", 2: "중등도", 3: "중증"}

_MIDPOINTS = np.array([12.5, 37.5, 62.5, 87.5])

# 모델에 들어가지 않는 패널티 계산용 피처 (앱 레이어에서 패널티 적용)
_PENALTY_COLS = [
    "음주여부",
    "1회음주량",
    "주당음주빈도",
    "월폭음빈도",  # 음주
    "현재흡연여부",  # 흡연 (현재)
    "평균수면시간",  # 수면 시간
]

# ── 패널티 함수 (counterfactual 델타 추정용) ──────────────────────────────────


def _alcohol_penalty(p: dict) -> int:
    if p.get("음주여부") == "음주안함":
        return 0
    penalty = 0
    weekly = p.get("1회음주량", 0) * p.get("주당음주빈도", 0)
    if weekly >= 14:
        penalty -= 15
    elif weekly >= 7:
        penalty -= 8
    elif weekly >= 3.5:
        penalty -= 3
    binge = p.get("월폭음빈도", 0)
    if binge >= 4:
        penalty -= 5
    elif binge >= 2:
        penalty -= 3
    return max(penalty, -20)


def _exercise_penalty(weekly_count: int) -> int:
    if weekly_count >= 5:
        return 0
    elif weekly_count >= 3:
        return -3
    elif weekly_count >= 1:
        return -7
    return -10


def _smoking_penalty(current_smoking: str, smoking_history: str) -> int:
    if current_smoking == "흡연":
        return -15
    if smoking_history not in ("없음", "비흡연", "흡연경험없음"):
        return -5
    return 0


def _sleep_penalty(sleep_hours: float, sleep_disorder: str) -> int:
    penalty = 0
    if sleep_disorder == "있음":
        penalty -= 5
    if sleep_hours < 6:
        penalty -= 5
    elif sleep_hours < 7:
        penalty -= 2
    return max(penalty, -10)


# ── 개선 번들 ─────────────────────────────────────────────────────────────────
# penalty_based=True  → delta = abs(current penalty)   (패널티 회복 방식)
# penalty_based=False → delta = ML score 변화           (설문 업데이트 방식)

_IMPROVEMENT_BUNDLES = [
    {
        "category": "금주",
        "challenge_type": "금주",
        "penalty_based": True,
        "condition": lambda row, p: p.get("음주여부") != "음주안함",
        "penalty_fn": lambda row, p: _alcohol_penalty(p),
    },
    {
        "category": "운동",
        "challenge_type": "운동",
        "penalty_based": True,
        "condition": lambda row, p: row.get("주당운동횟수", 0) < 5,
        "penalty_fn": lambda row, p: _exercise_penalty(int(row.get("주당운동횟수", 0))),
    },
    {
        "category": "금연",
        "challenge_type": "금연",
        "penalty_based": True,
        "condition": lambda row, p: p.get("현재흡연여부") == "흡연",
        "penalty_fn": lambda row, p: _smoking_penalty(p.get("현재흡연여부", "안함"), row.get("흡연여부", "없음")),
    },
    {
        "category": "수면",
        "challenge_type": "수면",
        "penalty_based": True,
        "condition": lambda row, p: p.get("평균수면시간", 8) < 7 or row.get("수면장애여부") == "있음",
        "penalty_fn": lambda row, p: _sleep_penalty(p.get("평균수면시간", 8), row.get("수면장애여부", "없음")),
    },
    {
        "category": "식습관",
        "challenge_type": "식습관",
        "penalty_based": False,
        "condition": lambda row, p: row.get("식습관자가평가") not in ("좋음", "매우좋음"),
        "changes": {"식습관자가평가": "좋음"},
    },
    {
        "category": "체중감량",
        "challenge_type": "체중감량",
        "penalty_based": False,
        "condition": lambda row, p: row.get("BMI", 0) > 23,
        "changes_fn": lambda row: {
            "몸무게": round(22.5 * (row["키"] / 100) ** 2, 1),
            "BMI": 22.5,
            "허리둘레": round(row["허리둘레"] * (22.5 / row["BMI"]), 1),
        },
    },
]

_model = None


def _load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def _temperature_scale(proba: np.ndarray, T: float = 1.4) -> np.ndarray:  # noqa: N803
    scaled = proba ** (1.0 / T)
    return scaled / scaled.sum()


def _proba_to_score(proba: np.ndarray) -> int:
    """확률로 건강 점수 산출 (20~100) — 패널티 미포함 순수 ML 점수"""
    scaled = _temperature_scale(proba)
    raw = float(np.dot(scaled, _MIDPOINTS))
    score = 20 + (87.5 - raw) / 75.0 * 80
    return min(max(20, round(score)), 100)


def _get_improvement_factors(input_df: pd.DataFrame, base_score: int, penalty_data: dict, top_n: int = 3) -> list[dict]:
    """
    Counterfactual 방식으로 개선 효과가 큰 생활습관 요인 반환.
    - 패널티 방식(금주/운동/금연/수면): abs(current penalty) = 회복 가능한 점수
    - ML 방식(식습관/체중감량): 목표값으로 변경 후 ML 점수 차이
    """
    model = _load_model()
    row = input_df.iloc[0].to_dict()

    results = []
    for bundle in _IMPROVEMENT_BUNDLES:
        if not bundle["condition"](row, penalty_data):
            continue

        if bundle["penalty_based"]:
            penalty = bundle["penalty_fn"](row, penalty_data)
            delta = abs(penalty)
        else:
            changes = bundle.get("changes") or bundle["changes_fn"](row)
            modified_df = pd.DataFrame([{**row, **changes}])
            proba = model.predict_proba(modified_df)[0]
            new_score = _proba_to_score(proba)
            delta = new_score - base_score

        if delta > 0:
            results.append(
                {
                    "category": bundle["category"],
                    "challenge_type": bundle["challenge_type"],
                    "score_delta": delta,
                }
            )

    results.sort(key=lambda x: x["score_delta"], reverse=True)
    return results[:top_n]


@app.task(name="predict_fatty_liver", bind=True, max_retries=3)
def predict_fatty_liver(self, input_data: dict) -> dict:
    """
    지방간 위험도 예측 Celery 태스크

    Returns:
        {
          "stage": int, "stage_label": str, "score": int (패널티 미포함 ML 점수),
          "probability": dict,
          "improvement_factors": [{"category": str, "challenge_type": str, "score_delta": int}]
        }
    """
    try:
        model = _load_model()

        # 패널티 계산용 피처 분리 (모델에 넣지 않음)
        penalty_data = {col: input_data.get(col) for col in _PENALTY_COLS}
        model_data = {k: v for k, v in input_data.items() if k not in _PENALTY_COLS}
        input_df = pd.DataFrame([model_data])

        proba = model.predict_proba(input_df)[0]
        stage = int(np.argmax(proba))
        base_score = _proba_to_score(proba)
        # 패널티는 앱 레이어(_apply_all_penalties)에서 처리 — 여기선 ML 점수만 반환

        improvement_factors = _get_improvement_factors(input_df, base_score, penalty_data)

        return {
            "stage": stage,
            "stage_label": LABEL_MAP[stage],
            "score": base_score,
            "probability": {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba)},
            "improvement_factors": improvement_factors,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=5)  # noqa: B904
