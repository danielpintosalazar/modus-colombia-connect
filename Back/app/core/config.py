from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Variables de entorno del backend. Ver .env.example para la lista completa."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "local"
    log_level: str = "INFO"

    google_cloud_project: str = ""
    google_application_credentials: str = "./firebase-key.json"
    firebase_storage_bucket: str = ""

    vertex_ai_region: str = "us-central1"
    vertex_ai_gemini_model: str = "gemini-2.0-flash"

    google_maps_api_key: str = ""

    bigquery_dataset: str = "metricas_desastre"

    agents_force_fallback: bool = False
    external_call_timeout_seconds: int = 8

    @property
    def has_google_credentials(self) -> bool:
        return bool(self.google_cloud_project)


@lru_cache
def get_settings() -> Settings:
    return Settings()
