import os
from functools import lru_cache


@lru_cache
def get_settings():
    origins_raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://localhost:3000",
    )
    origins = [o.strip() for o in origins_raw.split(",") if o.strip()]

    return {
        "gemini_api_key": os.getenv("GEMINI_API_KEY", ""),
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        "cors_origins": origins,
        "port": int(os.getenv("PORT", "8000")),
    }
