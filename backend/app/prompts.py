from app.labels import (
    AGE_LABELS,
    ANXIETY_LABELS,
    DURATION_LABELS,
    RELIGION_LABELS,
    SITUATION_LABELS,
    label,
)
from app.schemas import GenerateMessageRequest


def build_prompt(req: GenerateMessageRequest) -> str:
    situation = label(SITUATION_LABELS, req.situation, req.situation)
    age = label(AGE_LABELS, req.age, req.age)
    religion = label(RELIGION_LABELS, req.religion, req.religion)
    duration = label(DURATION_LABELS, req.duration, req.duration)
    anxiety = label(ANXIETY_LABELS, req.anxiety, req.anxiety)

    return f"""당신은 병원에서 이동식 침대로 이송되는 환자를 안심시키는 따뜻한 안내 멘트를 작성합니다.

다음 환자 정보를 반영해, 이송 중 천장 빔·음성으로 읽어줄 **2~3문장**의 짧고 부드러운 **한국어 존댓말** 멘트를 작성하세요.

[환자 정보]
- 상황/검사: {situation}
- 연령대: {age}
- 종교: {religion}
- 이동 예상 시간: {duration}
- 불안도: {anxiety}

[작성 규칙]
- 의료 정보를 단정하지 마세요 (진단·처치·검사 결과를 확정적으로 말하지 않음)
- 무섭거나 불안을 키우는 표현 금지
- 이동 시간({duration})을 자연스럽게 반영
- 소아: 쉽고 친근한 말투
- 고령: 천천히, 또박또박, 차분하게
- 불안도 높음: 더욱 차분하고 안정감 있게
- 종교 선택 시 해당 정서에 맞게 부드럽게 (없으면 중립)
- **멘트 본문만** 출력 (제목, 설명, 따옴표, 번호 없이)"""


def build_fallback_message(req: GenerateMessageRequest) -> str:
    """Gemini 실패 시 발표용 기본 멘트"""
    duration = label(DURATION_LABELS, req.duration, "잠시")
    situation = label(SITUATION_LABELS, req.situation, "검사실")

    if req.age == "child":
        return (
            f"지금 {situation} 쪽으로 천천히 가고 있어요. "
            f"약 {duration.replace('약 ', '')} 정도 걸려요. "
            "무서워하지 않아도 괜찮아요, 곧 도착해요."
        )

    if req.age == "elder":
        return (
            f"지금 {situation}로 이동하고 계십니다. "
            f"약 {duration.replace('약 ', '')} 정도 남았습니다. "
            "편안히 누르시고 천천히 가고 있으니 걱정하지 않으셔도 됩니다."
        )

    if req.anxiety == "high":
        return (
            f"지금 {situation}로 안전하게 이동 중입니다. "
            f"약 {duration.replace('약 ', '')} 정도 소요됩니다. "
            "천천히 가고 있으니 마음 편히 두셔도 괜찮습니다."
        )

    return (
        f"지금 {situation}로 이동 중입니다. "
        f"약 {duration.replace('약 ', '')} 정도 남았습니다. "
        "곧 도착하니 편안히 계시면 됩니다."
    )
