"""입력값 → 한국어 라벨 매핑"""

SITUATION_LABELS = {
    "mri": "MRI 검사실",
    "ct": "CT 검사실",
    "preop": "수술 전 검사실",
    "ward": "병동",
}

AGE_LABELS = {
    "child": "소아",
    "adult": "성인",
    "elder": "고령",
}

RELIGION_LABELS = {
    "none": "없음",
    "christian": "기독교",
    "catholic": "천주교",
    "buddhist": "불교",
}

DURATION_LABELS = {
    "2": "약 2분",
    "3": "약 3분",
    "5": "약 5분",
    "7": "약 7분",
    "10": "약 10분",
}

ANXIETY_LABELS = {
    "low": "낮음",
    "high": "높음",
}


def label(mapping: dict, key: str, fallback: str = "") -> str:
    return mapping.get(key, fallback or key)
