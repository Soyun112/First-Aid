import logging
import re

import httpx

from app.config import get_settings
from app.prompts import build_fallback_message, build_prompt
from app.schemas import GenerateMessageRequest

logger = logging.getLogger(__name__)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)


def _clean_message(text: str) -> str:
    cleaned = text.strip()
    # 따옴표·불릿 제거
    cleaned = re.sub(r'^["\'「『]|["\'」』]$', "", cleaned)
    cleaned = re.sub(r"^\d+[\.\)]\s*", "", cleaned)
    return cleaned.strip()


def _extract_gemini_text(data: dict) -> str | None:
    try:
        candidates = data.get("candidates") or []
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts") or []
        texts = [p.get("text", "") for p in parts if p.get("text")]
        merged = " ".join(t.strip() for t in texts if t.strip())
        return _clean_message(merged) if merged else None
    except (KeyError, IndexError, TypeError, AttributeError) as err:
        logger.warning("Gemini response parse failed: %s", err)
        return None


async def generate_comfort_message(req: GenerateMessageRequest) -> str:
    """
    Gemini API로 안심 멘트 생성.
    실패 시 fallback 멘트 반환 (발표 중 끊김 방지).
    """
    settings = get_settings()
    api_key = settings["gemini_api_key"]

    if not api_key:
        logger.warning("GEMINI_API_KEY not set — using fallback")
        return build_fallback_message(req)

    prompt = build_prompt(req)
    model = settings["gemini_model"]
    url = GEMINI_URL.format(model=model)

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 256,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                url,
                params={"key": api_key},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        message = _extract_gemini_text(data)
        if message:
            return message

        logger.warning("Gemini returned empty message — using fallback")
    except httpx.HTTPError as err:
        logger.warning("Gemini HTTP error: %s — using fallback", err)
    except Exception as err:  # noqa: BLE001 — 발표 안정성 우선
        logger.warning("Gemini unexpected error: %s — using fallback", err)

    return build_fallback_message(req)
