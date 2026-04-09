"""
음주 감점 유틸리티.
ML 없이 순수 Python으로 동작하는 함수만 유지.
"""


def _alcohol_penalty(input_data: dict) -> int:
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
