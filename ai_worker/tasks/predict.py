import os

import joblib
import pandas as pd

from ai_worker.main import app
from ai_worker.schemas.predict import PredictRequest

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/fatty_liver_model.pkl")

LABEL_MAP = {0: "정상", 1: "경도", 2: "중등도", 3: "중증"}

_model = None


def _load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


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
        {"stage": int, "stage_label": str, "probability": dict}
    """
    try:
        model = _load_model()
        input_df = pd.DataFrame([input_data])

        stage = int(model.predict(input_df)[0])
        proba = model.predict_proba(input_df)[0].tolist()

        return {
            "stage": stage,
            "stage_label": LABEL_MAP[stage],
            "probability": {LABEL_MAP[i]: round(p, 4) for i, p in enumerate(proba)},
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=5)
