"""Evidencias visuales de zonas afectadas (fase de análisis / investigación).

Sube la imagen a Cloud Storage, la registra en Firestore vinculada a una zona y
—opcionalmente— corre el Agente de Diagnóstico para clasificar el daño."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel

from app.agents.diagnostico.agent import diagnosticar
from app.core.auth import get_current_user, require_role
from app.core.firebase import FirebaseNotConfiguredError
from app.models.agentes import DiagnosticoInput
from app.models.evidencia import DiagnosticoEvidencia, Evidencia, TipoEvidencia
from app.models.usuario import Usuario
from app.services.busqueda_imagenes import ResultadoBusqueda, buscar_imagenes
from app.services.repositorio import (
    actualizar_evidencia,
    crear_evidencia,
    listar_evidencias,
    obtener_evidencia,
)
from app.services.storage import MAX_BYTES, TIPOS_IMAGEN_OK, subir_imagen

logger = logging.getLogger(__name__)
router = APIRouter(tags=["evidencias"])


def _diagnosticar(zona_id: str, imagen_url: str) -> DiagnosticoEvidencia | None:
    """Best-effort: si el diagnóstico falla, la evidencia igual queda registrada."""
    try:
        out = diagnosticar(DiagnosticoInput(imagen_url=imagen_url, zona_id=zona_id))
        modo = "fallback_reglas" if any("fallback" in d for d in out.datos_usados) else "vertex_ai_gemini"
        return DiagnosticoEvidencia(
            clasificacion=out.clasificacion,
            confianza=out.confianza,
            resumen=out.resumen,
            modo=modo,
        )
    except Exception:  # noqa: BLE001
        logger.exception("Diagnóstico de evidencia falló; se registra sin clasificación")
        return None


@router.get("/evidencias", response_model=list[Evidencia])
def listar_todas(
    zona_id: str | None = None,
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> list[Evidencia]:
    try:
        return listar_evidencias(zona_id)
    except FirebaseNotConfiguredError:
        return []


@router.get("/evidencias/buscar", response_model=list[ResultadoBusqueda])
def buscar(
    q: str = Query(..., min_length=2, description="Texto de búsqueda, p. ej. 'Mocoa avalancha 2017'"),
    fuente: str = Query("wikimedia", description="wikimedia | openverse | google"),
    limite: int = Query(12, ge=1, le=20),
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> list[ResultadoBusqueda]:
    """Busca imágenes reales con licencia abierta. NO guarda nada: devuelve
    candidatos para que un humano elija cuáles registrar con /desde-url."""
    try:
        return buscar_imagenes(q, fuente=fuente, limite=limite)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc


@router.get("/zonas/{zona_id}/evidencias", response_model=list[Evidencia])
def listar_de_zona(zona_id: str, _: Usuario = Depends(get_current_user)) -> list[Evidencia]:
    try:
        return listar_evidencias(zona_id)
    except FirebaseNotConfiguredError:
        return []


@router.post("/zonas/{zona_id}/evidencias", response_model=Evidencia, status_code=status.HTTP_201_CREATED)
async def subir_evidencia(
    zona_id: str,
    archivo: UploadFile = File(...),
    tipo: TipoEvidencia = Form("terreno"),
    fuente: str = Form(""),
    licencia: str = Form(""),
    fecha_captura: str | None = Form(None),
    descripcion: str = Form(""),
    ejecutar_diagnostico: bool = Form(True),
    usuario: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> Evidencia:
    content_type = archivo.content_type or "application/octet-stream"
    if content_type not in TIPOS_IMAGEN_OK:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Tipo no soportado: {content_type}")
    contenido = await archivo.read()
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "La imagen supera el límite de tamaño")

    try:
        gs_uri, url = subir_imagen(contenido, content_type, prefijo=f"evidencias/{zona_id}")
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    evidencia = Evidencia(
        id=f"ev-{uuid.uuid4().hex[:12]}",
        zona_id=zona_id,
        gs_uri=gs_uri,
        url=url,
        tipo=tipo,
        fuente=fuente,
        licencia=licencia,
        fecha_captura=fecha_captura,
        descripcion=descripcion,
        origen="subida",
        diagnostico=_diagnosticar(zona_id, url) if ejecutar_diagnostico else None,
        creada_por=usuario.uid,
        timestamp=datetime.now(timezone.utc),
    )
    try:
        crear_evidencia(evidencia)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    logger.info(
        "Evidencia %s registrada para zona %s (tipo=%s, diagnostico=%s)",
        evidencia.id,
        zona_id,
        tipo,
        evidencia.diagnostico.clasificacion if evidencia.diagnostico else "—",
    )
    return evidencia


class EvidenciaDesdeUrlInput(BaseModel):
    url: str
    tipo: TipoEvidencia = "terreno"
    fuente: str = ""
    licencia: str = ""
    fecha_captura: str | None = None
    descripcion: str = ""
    pagina: str | None = None
    autor: str | None = None
    ejecutar_diagnostico: bool = True


@router.post(
    "/zonas/{zona_id}/evidencias/desde-url",
    response_model=Evidencia,
    status_code=status.HTTP_201_CREATED,
)
def registrar_desde_url(
    zona_id: str,
    datos: EvidenciaDesdeUrlInput,
    usuario: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> Evidencia:
    """Registra una imagen que vive en una URL externa (resultado de /buscar).
    No se copia a Storage: se guarda la URL tal cual, con su procedencia y licencia."""
    if not datos.url.lower().startswith(("http://", "https://")):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La URL debe ser http(s)")

    desc = datos.descripcion
    if datos.autor:
        desc = (desc + f" · Autor: {datos.autor}").strip(" ·")
    if datos.pagina:
        desc = (desc + f" · Ficha: {datos.pagina}").strip(" ·")

    evidencia = Evidencia(
        id=f"ev-{uuid.uuid4().hex[:12]}",
        zona_id=zona_id,
        gs_uri="",
        url=datos.url,
        origen="url_externa",
        tipo=datos.tipo,
        fuente=datos.fuente,
        licencia=datos.licencia,
        fecha_captura=datos.fecha_captura,
        descripcion=desc,
        diagnostico=_diagnosticar(zona_id, datos.url) if datos.ejecutar_diagnostico else None,
        creada_por=usuario.uid,
        timestamp=datetime.now(timezone.utc),
    )
    try:
        crear_evidencia(evidencia)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    logger.info("Evidencia %s (url externa) registrada para zona %s desde %s", evidencia.id, zona_id, datos.fuente)
    return evidencia


@router.post("/evidencias/{evidencia_id}/diagnostico", response_model=Evidencia)
def rediagnosticar(
    evidencia_id: str,
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> Evidencia:
    """Re-ejecuta el Agente de Diagnóstico sobre una evidencia ya registrada."""
    try:
        evidencia = obtener_evidencia(evidencia_id)
        if evidencia is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Evidencia '{evidencia_id}' no encontrada")
        diag = _diagnosticar(evidencia.zona_id, evidencia.url)
        if diag is not None:
            actualizar_evidencia(evidencia_id, {"diagnostico": diag.model_dump(mode="json")})
            evidencia.diagnostico = diag
        return evidencia
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
