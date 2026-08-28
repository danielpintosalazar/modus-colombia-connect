"""Subida de imágenes a Cloud Storage, compartida por los endpoints de reporte y
de evidencias. Devuelve el `gs://` URI (para Gemini multimodal) y una URL firmada
de 7 días (para visualización en el frontend)."""

import uuid
from datetime import timedelta

from app.core.firebase import get_storage_bucket

_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
TIPOS_IMAGEN_OK: set[str] = set(_EXT)
MAX_BYTES = 12 * 1024 * 1024


def subir_imagen(contenido: bytes, content_type: str, *, prefijo: str) -> tuple[str, str]:
    """Sube `contenido` a `<prefijo>/<uuid>.<ext>`. Devuelve (gs_uri, url_firmada)."""
    bucket = get_storage_bucket()
    ext = _EXT.get(content_type, "bin")
    nombre = f"{prefijo.strip('/')}/{uuid.uuid4().hex}.{ext}"
    blob = bucket.blob(nombre)
    blob.upload_from_string(contenido, content_type=content_type)
    try:
        url = blob.generate_signed_url(expiration=timedelta(days=7), method="GET")
    except Exception:  # noqa: BLE001 — sin permiso para firmar: se devuelve la URL pública directa
        url = blob.public_url
    return f"gs://{bucket.name}/{nombre}", url
