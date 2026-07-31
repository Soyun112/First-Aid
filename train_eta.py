"""
LightGBM ETA 예측 모델 학습 스크립트

서버가 요청마다 재학습하지 않도록, 모델을 미리 학습해 파일로 저장합니다.
사용법:
  pip install pandas scikit-learn lightgbm joblib
  python train_eta.py
"""

from pathlib import Path

import joblib
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

# 고정 destination → 숫자 매핑 (sorted 자동 생성 금지)
DESTINATION_MAPPING = {
    "CT": 0,
    "MRI": 1,
    "병동": 2,
    "수술실": 3,
}

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "hospital_transport_log.csv"
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
TARGET_COL = "estimated_time"


def load_and_prepare(csv_path: Path) -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(csv_path)
    df["request_datetime"] = pd.to_datetime(df["request_datetime"])

    df["hour"] = df["request_datetime"].dt.hour
    df["weekday"] = df["request_datetime"].dt.weekday
    df["floor_difference"] = (df["start_floor"] - df["destination_floor"]).abs()

    unknown = set(df["destination"].unique()) - set(DESTINATION_MAPPING.keys())
    if unknown:
        raise ValueError(f"DESTINATION_MAPPING에 없는 destination: {sorted(unknown)}")

    df["destination"] = df["destination"].map(DESTINATION_MAPPING)

    X = df[FEATURE_COLS].copy()
    y = df[TARGET_COL].copy()
    return X, y


def main() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV를 찾을 수 없습니다: {CSV_PATH}")

    print(f"Loading {CSV_PATH.name} …")
    X, y = load_and_prepare(CSV_PATH)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    model = LGBMRegressor(random_state=42)
    print("Training LGBMRegressor …")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Test MAE: {mae:.4f}")

    joblib.dump(model, MODEL_PATH)
    joblib.dump(DESTINATION_MAPPING, MAPPING_PATH)
    print(f"Saved model → {MODEL_PATH.name}")
    print(f"Saved mapping → {MAPPING_PATH.name}")


if __name__ == "__main__":
    main()
