from app.labels import (
    AGE_LABELS,
    DURATION_LABELS,
    SITUATION_LABELS,
    label,
)
from app.schemas import GenerateMessageRequest


def build_prompt(req: GenerateMessageRequest) -> str:
    situation = label(SITUATION_LABELS, req.situation, req.situation)
    age = label(AGE_LABELS, req.age, req.age)
    duration = label(DURATION_LABELS, req.duration, req.duration)

    return f"""당신은 병원에서 이동식 침대로 이송되는 환자를 안심시키는 따뜻한 안내 멘트를 작성합니다.

다음 환자 정보를 반영해, 이송 중 천장 빔·음성으로 읽어줄 **한국어 구어체 존댓말** 멘트를 작성하세요.
지금보다 한 문장 더 길게, **총 2~3문장**으로 작성하고 **3문장을 넘기지 마세요**.

[환자 정보]
- 연령대: {age}
- 이동 예상 시간: {duration}
- 이동 맥락: {situation} (데모 기본값)

[문장 구성]
1. 첫 문장: 지금 어디로 이동 중인지 안내
   (예: "지금 검사실로 이동 중이에요.", "지금은 수술 전 검사실로 천천히 가고 있어요.")
2. 이어지는 문장(1~2문장): 안심시키는 따뜻한 말
   (무섭지 않아도 된다, 곧 도착한다, 옆에 의료진이 있다, 천천히 안전하게 간다 등)
3. 이동 시간({duration})을 자연스럽게 한 번 녹여도 좋습니다.

[작성 규칙]
- 차분하고 따뜻한 톤, 환자가 듣기 편한 구어체
- 의학적 진단·처방·검사 결과를 단정하지 마세요 (정서적 안내만)
- 무섭거나 불안을 키우는 표현 금지
- 소아: 쉽고 친근한 말투
- 성인: 차분하고 존중하는 구어체
- **멘트 본문만** 출력 (제목, 설명, 따옴표, 번호 없이)"""


def build_fallback_message(req: GenerateMessageRequest) -> str:
    """Gemini 실패 시 발표용 기본 멘트 (2~3문장)"""
    duration = label(DURATION_LABELS, req.duration, "잠시")
    duration_short = duration.replace("약 ", "")
    destination = label(SITUATION_LABELS, req.situation, "목적지")
    # '병동로' 같은 조사 오류 방지
    to_dest = {
        "mri": "MRI 검사실로",
        "ct": "CT 검사실로",
        "preop": "수술 전 검사실로",
        "ward": "병동으로",
    }.get(req.situation, f"{destination}로")

    if req.age == "child":
        return (
            f"지금 {destination} 쪽으로 천천히 가고 있어요. "
            f"약 {duration_short} 정도면 도착할 거예요. "
            "옆에 선생님들이 함께 계시니까 무섭지 않아도 괜찮아요."
        )

    if req.age == "elder":
        return (
            f"지금은 {to_dest} 안전하게 이동하고 계십니다. "
            f"약 {duration_short} 정도 남았으니 편안히 누워 계셔도 됩니다. "
            "의료진이 옆에서 함께 이동하고 있으니 걱정하지 않으셔도 괜찮습니다."
        )

    if req.anxiety == "high":
        return (
            f"지금은 {to_dest} 천천히 이동 중이에요. "
            f"약 {duration_short} 정도면 도착하니 깊이 숨 쉬며 기다려 주셔도 됩니다. "
            "옆에 의료진이 함께 있으니 무섭지 않으셔도 괜찮아요."
        )

    return (
        f"지금은 {to_dest} 이동하고 있어요. "
        f"약 {duration_short} 정도 남았고, 천천히 안전하게 가고 있습니다. "
        "곧 도착하니 마음 편히 계셔도 괜찮아요."
    )
