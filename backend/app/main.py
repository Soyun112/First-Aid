import logging

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.config import get_settings
from app.schemas import GenerateMessageRequest, GenerateMessageResponse
from app.services.gemini import generate_comfort_message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="First Aid API",
    description="이송 안심 멘트 생성 API (Gemini)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings["cors_origins"],
    allow_origin_regex=r"https://.*\.(onrender|vercel)\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Accept", "Content-Type", "Authorization"],
)


@app.get("/")
async def health():
    return {"status": "ok", "service": "first-aid-api"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/generate-message", response_model=GenerateMessageResponse)
async def generate_message(body: GenerateMessageRequest):
    """
    환자 상황을 받아 Gemini로 이송 안심 멘트 생성.
    실패 시 기본 멘트 반환.
    """
    logger.info(
        "generate-message: situation=%s age=%s duration=%s",
        body.situation,
        body.age,
        body.duration,
    )
    message = await generate_comfort_message(body)
    return GenerateMessageResponse(message=message)
