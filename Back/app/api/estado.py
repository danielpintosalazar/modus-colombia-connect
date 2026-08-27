"""Endpoints de solo lectura para el rol 'estado': visión nacional agregada."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import require_role
from app.core.firebase import FirebaseNotConfiguredError, get_firestore_client
from app.models.orden_despliegue import OrdenDespliegue
from app.models.usuario import Usuario

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/estado", tags=["estado"])


@router.get("/ordenes-despliegue", response_model=list[OrdenDespliegue])
def listar_ordenes_despliegue(_: Usuario = Depends(require_role("estado", "entidad_respuesta"))) -> list[OrdenDespliegue]:
    try:
        db = get_firestore_client()
        return [OrdenDespliegue(**d.to_dict()) for d in db.collection("ordenes_despliegue").stream()]
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
