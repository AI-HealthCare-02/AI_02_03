import os

import joblib
import numpy as np
import pandas as pd

from ai_worker.main import app
from ai_worker.schemas.predict import PredictRequest

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/fatty_liver_model.pkl")

LABEL_MAP = {0: "정상", 1: "경미", 2: "중등도", 3: "중증"}

# 점수 산출: 구간 중앙값 가중 합산 후 반전 및 정규화 (0~100, 높을수록 건강)
# raw = p0×12.5 + p1×37.5 + p2×62.5 + p3×87.5  (범위: 12.5~87.5)
# score = (87.5 - raw) / 75 × 100               (범위: 0~100)
_MIDPOINTS = np.array([12.5, 37.5, 62.5, 87.5])

_model = None


def _load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def _temperature_scale(proba: np.ndarray, T: float = 1.8) -> np.ndarray:
    """확률을 부드럽게 (극단적 확률 완화)"""
    scaled = proba ** (1.0 / T)
    return scaled / scaled.sum()


def _proba_to_score(proba: np.ndarray) -> int:
    """원본 확률로 위험 점수 산출 (10~100, 높을수록 건강)"""
    scaled = _temperature_scale(proba)
    raw = float(np.dot(scaled, _MIDPOINTS))
    score = (87.5 - raw) / 75.0 * 100
    return min(max(10, round(score)), 100)


@app.task(name="predict_fatty_liver", bind=True, max_retries=3)
def predict_fatty_liver(self, input_data: dict) -> dict:
    """
    지방간 위험도 예측 Celery 태스크

    백엔드에서 호출:
        from ai_worker.tasks.predict import predict_fatty_liver
        result = predict_fatty_liver.delay(input_data)
        output = result.get(timeout=30)

    Args:
        input_data: PredictRequest.to_features() 결과 dict

    Returns:
        {"stage": int, "stage_label": str, "score": int, "probability": dict}
    """
    try:
        model = _load_model()
        input_df = pd.DataFrame([input_data])

        proba = model.predict_proba(input_df)[0]
        stage = int(np.argmax(proba))
        score = _proba_to_score(proba)

        return {
            "stage": stage,
            "stage_label": LABEL_MAP[stage],
            "score": score,
            "probability": {LABEL_MAP[i]: round(float(p), 4) for i, p in enumerate(proba)},
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=5)
