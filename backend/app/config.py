import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./accountability.db")
APP_SECRET = os.getenv("APP_SECRET", "development-only-change-this-secret")
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", "604800"))
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
MAX_GROUP_MEMBERS = int(os.getenv("MAX_GROUP_MEMBERS", "8"))
if MAX_GROUP_MEMBERS < 2:
    raise ValueError("MAX_GROUP_MEMBERS must allow at least two people in a circle.")
if APP_SECRET == "development-only-change-this-secret" and os.getenv("ENVIRONMENT") == "production":
    raise ValueError("APP_SECRET must be set to a private random value in production.")
