"""Endpoints del rol 'estado_entidad_respuesta': visión nacional agregada y
notificaciones de participación requerida a entidades del Estado."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.auth import require_role
from app.core.firebase import FirebaseNotConfiguredError, get_firestore_client
from app.models.operaciones import NotificacionEntidad
from app.models.orden_despliegue import OrdenDespliegue
from app.models.usuario import Usuario
from app.services.repositorio import crear_notificacion_entidad, listar_notificaciones_entidad

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/estado", tags=["estado"])


@router.get("/ordenes-despliegue", response_model=list[OrdenDespliegue])
def listar_ordenes_despliegue(_: Usuario = Depends(require_role("estado_entidad_respuesta"))) -> list[OrdenDespliegue]:
    try:
        db = get_firestore_client()
        return [OrdenDespliegue(**d.to_dict()) for d in db.collection("ordenes_despliegue").stream()]
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc


class NuevaNotificacionInput(BaseModel):
    entidad_nombre: str
    motivo: str
    zona_id: str | None = None
    emergencia_id: str | None = None


@router.get("/notificaciones", response_model=list[NotificacionEntidad])
def get_notificaciones(_: Usuario = Depends(require_role("estado_entidad_respuesta"))) -> list[NotificacionEntidad]:
    try:
        return listar_notificaciones_entidad()
    except FirebaseNotConfiguredError:
        logger.info("Firestore no configurado; se devuelve lista de notificaciones vacía")
        return []


@router.post("/notificaciones", response_model=NotificacionEntidad, status_code=status.HTTP_201_CREATED)
def post_notificacion(
    datos: NuevaNotificacionInput,
    usuario: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> NotificacionEntidad:
    notificacion = NotificacionEntidad(
        id=f"ntf-{uuid.uuid4().hex[:12]}",
        entidad_nombre=datos.entidad_nombre,
        zona_id=datos.zona_id,
        emergencia_id=datos.emergencia_id,
        motivo=datos.motivo,
        emitida_por=usuario.uid,
        timestamp=datetime.now(timezone.utc),
    )
    try:
        crear_notificacion_entidad(notificacion)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    logger.info("Notificación %s a '%s' por %s", notificacion.id, datos.entidad_nombre, usuario.uid)
    return notificacion
