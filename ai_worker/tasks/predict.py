import os
import warnings

import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", message="X does not have valid feature names")

from ai_worker.main import app

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/fatty_liver_model.pkl")

LABEL_MAP = {0: "정상", 1: "경미", 2: "중등도", 3: "중증"}

_MIDPOINTS = np.array([12.5, 37.5, 62.5, 87.5])

# 개선 번들: 각 생활습관 카테고리별 목표값 + 매칭할 챌린지 type
# condition: 이미 목표치에 도달했으면 번들 스킵
_IMPROVEMENT_BUNDLES = [
    {
        "category": "금주",
        "challenge_type": "금주",
        "condition": lambda r: r.get("음주여부") != "음주안함",
        "changes": {
            "음주여부": "음주안함",
            "1회음주량": 0.0,
            "주당음주빈도": 0.0,
            "월폭음빈도": 0.0,
        },
    },
    {
        "category": "운동",
        "challenge_type": "운동",
        "condition": lambda r: r.get("주당운동횟수", 0) < 5,
        "changes": {
            "운동여부": "운동함",
            "주당운동횟수": 5,
        },
    },
    {
        "category": "식습관",
        "challenge_type": "식단",
        "condition": lambda r: r.get("식습관자가평가") != "좋음",
        "changes": {
            "식습관자가평가": "좋음",
        },
    },
    {
        "category": "수면",
        "challenge_type": "수면",
        "condition": lambda r: r.get("평균수면시간", 8) < 7 or r.get("수면장애여부") == "있음",
        "changes": {
            "평균수면시간": 7.5,
            "수면장애여부": "없음",
        },
    },
    {
        "category": "체중감량",
        "challenge_type": "식단",
        "condition": lambda r: r.get("BMI", 0) > 23,
        "changes_fn": lambda r: {
            "몸무게": round(22.5 * (r["키"] / 100) ** 2, 1),
            "BMI": 22.5,
            "허리둘레": round(r["허리둘레"] * (22.5 / r["BMI"]), 1),
        },
    },
]

_model = None


def _load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def _temperature_scale(proba: np.ndarray, T: float = 1.8) -> np.ndarray:
    scaled = proba ** (1.0 / T)
    return scaled / scaled.sum()


def _proba_to_score(proba: np.ndarray) -> int:
    """확률로 건강 점수 산출 (10~100, 높을수록 건강)"""
    scaled = _temperature_scale(proba)
    raw = float(np.dot(scaled, _MIDPOINTS))
    score = (87.5 - raw) / 75.0 * 100
    return min(max(10, round(score)), 100)


def _get_improvement_factors(input_df: pd.DataFrame, current_score: int, top_n: int = 3) -> list[dict]:
    """
    Counterfactual 방식으로 개선 효과가 큰 생활습관 요인 반환.
    각 번들의 목표값으로 바꿔서 실제 score 변화를 측정하고 상위 top_n 반환.
    """
    model = _load_model()
    row = input_df.iloc[0].to_dict()

    results = []
    for bundle in _IMPROVEMENT_BUNDLES:
        if not bundle["condition"](row):
            continue

        changes = bundle.get("changes") or bundle["changes_fn"](row)
        modified_df = pd.DataFrame([{**row, **changes}])
        proba = model.predict_proba(modified_df)[0]
        new_score = _proba_to_score(proba)
        delta = new_score - current_score

        if delta > 0:
            results.append({
                "category": bundle["category"],
                "challenge_type": bundle["challenge_type"],
                "score_delta": delta,
            })

    results.sort(key=lambda x: x["score_delta"], reverse=True)
    return results[:top_n]


@app.task(name="predict_fatty_liver", bind=True, max_retries=3)
def predict_fatty_liver(self, input_data: dict) -> dict:
    """
    지방간 위험도 예측 Celery 태스크

    Returns:
        {
          "stage": int, "stage_label": str, "score": int,
          "probability": dict,
          "improvement_factors": [{"category": str, "challenge_type": str, "score_delta": int}]
        }
    """
    try:
        model = _load_model()
        input_df = pd.DataFrame([input_data])

        proba = model.predict_proba(input_df)[0]
        stage = int(np.argmax(proba))
        score = _proba_to_score(proba)
        improvement_factors = _get_improvement_factors(input_df, score)

        return {
            "stage": stage,
            "stage_label": LABEL_MAP[stage],
            "score": score,
            "probability": {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba)},
            "improvement_factors": improvement_factors,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=5)
