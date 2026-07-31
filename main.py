"""
LightGBM ETA 예측 FastAPI 서버

모델은 서버 시작 시 1회만 로드합니다 (요청마다 재학습하지 않음).

실행 (프로젝트 루트에서):
  uvicorn main:app --reload --host 0.0.0.0 --port 8001

프론트 예:
  fetch('http://localhost:8001/predict', { method: 'POST', ... })
"""

from __future__ import annotations

import math
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "eta_model.joblib"
MAPPING_PATH = ROOT / "destination_mapping.joblib"

FEATURE_COLS = [
    "start_floor",
    "destination",
    "destination_floor",
    "transport_count_now",
    "hour",
    "weekday",
    "floor_difference",
]

# 폴백용 목적지 보정 (문자열 키)
DEST_BONUS = {
    "CT": 0.5,
    "수술실": 1.0,
    "MRI": 1.5,
    "병동": 0.0,
}

app = FastAPI(title="First Aid ETA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model: Any = None
destination_mapping: dict[str, int] = {}
model_load_error: str | None = None


def default_transport_count(hour: int) -> int:
    """시간대별 대표 이송 건수"""
    if 6 <= hour < 8:
        return 2
    if 8 <= hour < 10:
        return 11
    if 10 <= hour < 12:
        return 9
    if 12 <= hour < 13:
        return 5
    if 13 <= hour < 15:
        return 7
    if 15 <= hour < 17:
        return 5
    return 2


def congestion_bonus(transport_count_now: int) -> float:
    if transport_count_now <= 5:
        return 0.0
    if transport_count_now <= 10:
        return 1.0
    return 2.0


def fallback_eta(
    start_floor: int,
    destination: str,
    destination_floor: int,
    transport_count_now: int,
) -> int:
    """모델 로드/예측 실패 시 규칙 기반 ETA (분, 올림)"""
    floor_difference = abs(start_floor - destination_floor)
    dest_bonus = DEST_BONUS.get(destination, 0.0)
    raw = (
        2
        + floor_difference * 0.4
        + dest_bonus
        + congestion_bonus(transport_count_now)
    )
    return int(math.ceil(raw))


def encode_destination(destination: str) -> int:
    if destination not in destination_mapping:
        raise HTTPException(
            status_code=400,
            detail=f"알 수 없는 destination: {destination}. "
            f"허용: {list(destination_mapping.keys())}",
        )
    return int(destination_mapping[destination])


def predict_eta_minutes(
    *,
    start_floor: int,
    destination: str,
    destination_floor: int,
    transport_count_now: int,
    hour: int,
    weekday: int,
) -> int:
    floor_difference = abs(start_floor - destination_floor)

    if model is None or model_load_error is not None:
        return fallback_eta(
            start_floor, destination, destination_floor, transport_count_now
        )

    try:
        dest_code = encode_destination(destination)
        row = pd.DataFrame(
            [
                {
                    "start_floor": start_floor,
                    "destination": dest_code,
                    "destination_floor": destination_floor,
                    "transport_count_now": transport_count_now,
                    "hour": hour,
                    "weekday": weekday,
                    "floor_difference": floor_difference,
                }
            ],
            columns=FEATURE_COLS,
        )
        pred = float(model.predict(row)[0])
        return int(math.ceil(pred))
    except HTTPException:
        raise
    except Exception as err:  # noqa: BLE001 — 폴백으로 서버 유지
        print(f"predict fallback due to error: {err}")
        return fallback_eta(
            start_floor, destination, destination_floor, transport_count_now
        )


@app.on_event("startup")
def load_artifacts() -> None:
    global model, destination_mapping, model_load_error
    try:
        if not MODEL_PATH.exists() or not MAPPING_PATH.exists():
            raise FileNotFoundError(
                f"모델 파일 없음: {MODEL_PATH.name}, {MAPPING_PATH.name}"
            )
        model = joblib.load(MODEL_PATH)
        destination_mapping = joblib.load(MAPPING_PATH)
        model_load_error = None
        print(f"Loaded model from {MODEL_PATH.name}")
        print(f"Loaded mapping from {MAPPING_PATH.name}: {destination_mapping}")
    except Exception as err:  # noqa: BLE001
        model = None
        destination_mapping = {
            "CT": 0,
            "MRI": 1,
            "병동": 2,
            "수술실": 3,
        }
        model_load_error = str(err)
        print(f"Model load failed — using rule-based fallback: {err}")


class PredictRequest(BaseModel):
    start_floor: int = Field(..., examples=[8])
    destination: str = Field(..., examples=["MRI"])
    destination_floor: int = Field(..., examples=[-3])
    transport_count_now: int | None = Field(
        default=None,
        description="없으면 현재 시각 기준 대표값 사용",
        examples=[9],
    )


class PredictResponse(BaseModel):
    eta_min: int
    hour: int


class HourlyItem(BaseModel):
    hour: int
    eta_min: int
    transport_count_now: int


class PredictHourlyResponse(BaseModel):
    items: list[HourlyItem]


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_loaded": model is not None and model_load_error is None,
        "model_error": model_load_error,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    now = datetime.now()
    hour = now.hour
    weekday = now.weekday()
    count = (
        req.transport_count_now
        if req.transport_count_now is not None
        else default_transport_count(hour)
    )

    eta = predict_eta_minutes(
        start_floor=req.start_floor,
        destination=req.destination,
        destination_floor=req.destination_floor,
        transport_count_now=count,
        hour=hour,
        weekday=weekday,
    )
    return PredictResponse(eta_min=eta, hour=hour)


@app.post("/predict_hourly", response_model=PredictHourlyResponse)
def predict_hourly(req: PredictRequest) -> PredictHourlyResponse:
    """6시~21시 각 시간대 ETA (설정 화면 표/그래프용)"""
    weekday = datetime.now().weekday()
    items: list[HourlyItem] = []

    for hour in range(6, 22):  # 6 ~ 21 inclusive
        count = default_transport_count(hour)
        eta = predict_eta_minutes(
            start_floor=req.start_floor,
            destination=req.destination,
            destination_floor=req.destination_floor,
            transport_count_now=count,
            hour=hour,
            weekday=weekday,
        )
        items.append(
            HourlyItem(hour=hour, eta_min=eta, transport_count_now=count)
        )

    return PredictHourlyResponse(items=items)


# uvicorn main:app --reload --host 0.0.0.0 --port 8001
