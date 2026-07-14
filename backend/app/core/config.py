from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "KAPLER AI"
    API_V1_STR: str = "/api/v1"

    
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7   
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  

    
    MONGODB_URI: str = "mongodb://localhost:27017/orbital_guardian"

    
    REDIS_URL: str = "redis://localhost:6379/0"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672//"

    
    
    SPACETRACK_USERNAME: Optional[str] = None
    SPACETRACK_PASSWORD: Optional[str] = None

    # Satellite data sources, tried in this order. If one fails, ingestion falls through
    # to the next, so a single upstream outage cannot stop the pipeline (issue #15).
    # Known providers: space-track, celestrak, cache.
    SATELLITE_PROVIDER_PRIORITY: str = "space-track,celestrak,cache"
    CELESTRAK_BASE_URL: str = "https://celestrak.org"

    
    OPENAI_API_KEY: Optional[str] = "mock-key"

    
    NASA_DONKI_API_KEY: str = "u9eTrXnq1OLkt0qi1e84CwPbcJNTceohxjx2Bi0E"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
