from pydantic_settings import BaseSettings
from typing import List, Optional
import secrets


class Settings(BaseSettings):
    PROJECT_NAME: str = "KEPLER AI"
    API_V1_STR: str = "/api/v1"

    # JWT — MUST be overridden in production via the SECRET_KEY env var.
    # Generate a secure value with: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7   # 7 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # CORS — comma-separated list of allowed origins (set via env var in production).
    # Example: ALLOWED_ORIGINS=https://keplerai.vercel.app,https://staging.keplerai.vercel.app
    ALLOWED_ORIGINS: str = "https://keplerai.vercel.app,http://localhost:5173,http://localhost:3000"

    # PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/orbital_guardian"

    # Celery broker/backend (only needed if running Celery workers separately)
    REDIS_URL: str = "redis://localhost:6379/0"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672//"

    # Space-Track.org credentials (optional — falls back to Celestrak)
    SPACETRACK_USERNAME: Optional[str] = None
    SPACETRACK_PASSWORD: Optional[str] = None

    # Satellite data sources, tried in this order. If one fails, ingestion falls through
    # to the next, so a single upstream outage cannot stop the pipeline (issue #15).
    # Known providers: space-track, celestrak, cache.
    SATELLITE_PROVIDER_PRIORITY: str = "space-track,celestrak,cache"
    CELESTRAK_BASE_URL: str = "https://celestrak.org"

    # OpenAI — optional; AI agent endpoints will be unavailable without a real key.
    OPENAI_API_KEY: Optional[str] = None

    # NASA DONKI space weather API key (public demo key provided as default)
    NASA_DONKI_API_KEY: str = "DEMO_KEY"

    def get_allowed_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS env var into a list for CORSMiddleware."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
