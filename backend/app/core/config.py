"""Application configuration.

All runtime settings come from environment variables (see backend/.env.example).
Nothing secret is hard-coded; defaults are only for local development.
"""
import os
from datetime import timedelta


class Config:
    ENV = os.getenv("MSEA_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
    JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRES_HOURS", "10")))
    # MySQL in every real environment; SQLite only for unit tests.
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://msea:msea@127.0.0.1:3306/msea?charset=utf8mb4",
    )
    SQL_ECHO = os.getenv("SQL_ECHO", "0") == "1"
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
    TIMEZONE = os.getenv("TIMEZONE", "Asia/Kolkata")
    ACADEMIC_YEAR = os.getenv("ACADEMIC_YEAR", "2026-27")
    # Automation
    SCHEDULER_ENABLED = os.getenv("SCHEDULER_ENABLED", "1") == "1"
    GAP_SCAN_CRON_HOUR = int(os.getenv("GAP_SCAN_CRON_HOUR", "6"))
    DAILY_TARGET_PCT = float(os.getenv("DAILY_TARGET_PCT", "80"))  # % of month outstanding
    ATTENDANCE_MIN_PCT = float(os.getenv("ATTENDANCE_MIN_PCT", "75"))
    # Object storage for uploads (OCI Object Storage, S3-compatible endpoint)
    OBJECT_STORAGE_ENDPOINT = os.getenv("OBJECT_STORAGE_ENDPOINT", "")
    OBJECT_STORAGE_BUCKET = os.getenv("OBJECT_STORAGE_BUCKET", "msea-uploads")
    OBJECT_STORAGE_ACCESS_KEY = os.getenv("OBJECT_STORAGE_ACCESS_KEY", "")
    OBJECT_STORAGE_SECRET_KEY = os.getenv("OBJECT_STORAGE_SECRET_KEY", "")
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/var/msea/uploads")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


class TestConfig(Config):
    ENV = "test"
    DATABASE_URL = "sqlite+pysqlite:///:memory:"
    SCHEDULER_ENABLED = False
    JWT_SECRET = "test-secret"
