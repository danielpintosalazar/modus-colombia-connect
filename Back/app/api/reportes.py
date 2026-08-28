"""Subida de evidencia fotográfica a Cloud Storage. La usa el reporte de
emergencia / damnificado (D6: P0 acepta texto + imagen + geolocalización).
Devuelve el gs:// URI y una URL firmada para el frontend y el Agente de Diagnóstico."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.firebase import FirebaseNotConfiguredError
from app.models.usuario import Usuario
from app.services.storage import MAX_BYTES, TIPOS_IMAGEN_OK, subir_imagen

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reportes", tags=["reportes"])


class ImagenSubidaResponse(BaseModel):
    url: str
    gs_uri: str
    content_type: str


@router.post("/imagen", response_model=ImagenSubidaResponse)
async def subir_imagen_reporte(
    archivo: UploadFile = File(...),
    usuario: Usuario = Depends(get_current_user),
) -> ImagenSubidaResponse:
    content_type = archivo.content_type or "application/octet-stream"
    if content_type not in TIPOS_IMAGEN_OK:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Tipo no soportado: {content_type}")

    contenido = await archivo.read()
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "La imagen supera el límite de tamaño")

    try:
        gs_uri, url = subir_imagen(contenido, content_type, prefijo=f"reportes/{usuario.uid}")
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    logger.info("Imagen de reporte subida: %s (%d bytes, usuario=%s)", gs_uri, len(contenido), usuario.uid)
    return ImagenSubidaResponse(url=url, gs_uri=gs_uri, content_type=content_type)
