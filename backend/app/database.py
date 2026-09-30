import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic_settings import BaseSettings, SettingsConfigDict


# Find the SetuCare project folder
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    DB_HOST: str = ""
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_NAME: str = ""
    DB_PORT: str = "3306"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore"
    )


settings = Settings()


def get_database_url() -> str:
    # 1. Environment variable DATABASE_URL (e.g. set on Render)
    db_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
    if db_url:
        if db_url.startswith("mysql://"):
            return db_url.replace("mysql://", "mysql+pymysql://", 1)
        return db_url

    # 2. Separate MYSQL_* or DB_* environment variables
    host = os.getenv("MYSQL_HOST") or os.getenv("DB_HOST") or settings.DB_HOST
    user = os.getenv("MYSQL_USER") or os.getenv("DB_USER") or settings.DB_USER
    password = os.getenv("MYSQL_PASSWORD") or os.getenv("DB_PASSWORD") or settings.DB_PASSWORD
    dbname = os.getenv("MYSQL_DATABASE") or os.getenv("DB_NAME") or settings.DB_NAME
    port = os.getenv("MYSQL_PORT") or os.getenv("DB_PORT") or settings.DB_PORT or "3306"

    if host and dbname:
        auth = f"{user}:{password}@" if user or password else ""
        return f"mysql+pymysql://{auth}{host}:{port}/{dbname}"

    # 3. Default fallback to local SQLite database
    return "sqlite:///./setucare.db"


FINAL_DB_URL = get_database_url()
connect_args = {"check_same_thread": False} if FINAL_DB_URL.startswith("sqlite") else {}

engine = create_engine(FINAL_DB_URL, connect_args=connect_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()