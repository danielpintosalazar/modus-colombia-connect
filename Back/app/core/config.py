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
    vertex_ai_gemini_model: str = "gemini-2.5-flash"

    google_maps_api_key: str = ""

    # Búsqueda de imágenes reales (fase de análisis). Opcional: sin esto se usan
    # Wikimedia Commons y Openverse, que no requieren clave.
    # Para la fuente "google" hace falta SIEMPRE el motor de búsqueda (cx) +
    # auth por API key O por cuenta de servicio (una de las dos).
    google_cse_id: str = ""
    google_search_api_key: str = ""
    google_search_credentials: str = ""  # ruta al JSON de cuenta de servicio

    # Sistema de Identificación de desastres (búsqueda web con la misma key/cx).
    # Si ya hay un desastre buscado hace menos de estas horas, no se vuelve a
    # llamar a la API — se sirve la caché de Firestore.
    busqueda_desastres_ventana_horas: int = 12

    bigquery_dataset: str = "metricas_desastre"

    agents_force_fallback: bool = False
    external_call_timeout_seconds: int = 12

    @property
    def has_google_credentials(self) -> bool:
        return bool(self.google_cloud_project)


@lru_cache
def get_settings() -> Settings:
    return Settings()
