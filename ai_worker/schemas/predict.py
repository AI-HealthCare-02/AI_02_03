from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    나이: float = Field(..., ge=12, le=80)
    성별: str
    키: float
    몸무게: float
    BMI: float
    허리둘레: float
    음주여부: str
    일회음주량: float = Field(..., alias="1회음주량")
    주당음주빈도: float
    월폭음빈도: float
    운동여부: str
    주당운동횟수: int
    흡연여부: str
    현재흡연여부: str
    당뇨진단여부: str
    고혈압진단여부: str
    수면장애여부: str
    평균수면시간: float
    식습관자가평가: str

    model_config = {"populate_by_name": True}

    def to_features(self) -> dict:
        return {
            "나이": self.나이,
            "성별": self.성별,
            "키": self.키,
            "몸무게": self.몸무게,
            "BMI": self.BMI,
            "허리둘레": self.허리둘레,
            "음주여부": self.음주여부,
            "1회음주량": self.일회음주량,
            "주당음주빈도": self.주당음주빈도,
            "월폭음빈도": self.월폭음빈도,
            "운동여부": self.운동여부,
            "주당운동횟수": self.주당운동횟수,
            "흡연여부": self.흡연여부,
            "현재흡연여부": self.현재흡연여부,
            "당뇨진단여부": self.당뇨진단여부,
            "고혈압진단여부": self.고혈압진단여부,
            "수면장애여부": self.수면장애여부,
            "평균수면시간": self.평균수면시간,
            "식습관자가평가": self.식습관자가평가,
        }


class PredictResponse(BaseModel):
    stage: int
    stage_label: str
    probability: dict[str, float]
