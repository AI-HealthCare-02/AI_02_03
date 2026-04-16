"""
외부 패널티 유틸리티.
ML 모델이 잡지 못하거나 비선형 노이즈가 심한 항목을 별도 감점으로 처리.
"""


def _alcohol_penalty(input_data: dict) -> int:
    """음주량 기반 패널티 (최대 -20)"""
    if input_data.get("음주여부") == "음주안함":
        return 0

    penalty = 0
    weekly_total = input_data.get("1회음주량", 0) * input_data.get("주당음주빈도", 0)
    if weekly_total >= 14:
        penalty -= 15
    elif weekly_total >= 7:
        penalty -= 8
    elif weekly_total >= 3.5:
        penalty -= 3

    binge = input_data.get("월폭음빈도", 0)
    if binge >= 4:
        penalty -= 5
    elif binge >= 2:
        penalty -= 3

    return max(penalty, -20)


def _exercise_penalty(weekly_count: int) -> int:
    """운동 부족 패널티 (최대 -10)
    counterfactual: 0→5회 시 모델 +8점, 비선형이라 패널티로 안정적으로 처리
    """
    if weekly_count >= 5:
        return 0
    elif weekly_count >= 3:
        return -3
    elif weekly_count >= 1:
        return -7
    else:
        return -10


def _smoking_penalty(current_smoking: str, smoking_history: str) -> int:
    """흡연 패널티 (최대 -15)
    counterfactual: 모델에서 흡연여부 효과 0 → 패널티로 처리
    """
    if current_smoking == "흡연":
        return -15
    if smoking_history not in ("없음", "비흡연"):  # 과거 흡연
        return -5
    return 0


def _sleep_penalty(sleep_hours: float, sleep_disorder: str) -> int:
    """수면 부족/장애 패널티 (최대 -10)
    counterfactual: 모델이 수면장애 해소 시 역방향(-1) → 패널티로 처리
    """
    penalty = 0
    if sleep_disorder == "있음":
        penalty -= 5
    if sleep_hours < 6:
        penalty -= 5
    elif sleep_hours < 7:
        penalty -= 2
    return max(penalty, -10)
