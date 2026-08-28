"""Avances de campo: el rol `estado_entidad_respuesta` reporta entregas y
progreso de una intervención. Si el avance apunta a una iniciativa, se actualiza
su `progreso` en Firestore."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import require_role
from app.core.firebase import FirebaseNotConfiguredError
from app.models.operaciones import AvanceCampo
from app.models.usuario import Usuario
from app.services.repositorio import crear_avance_campo, listar_avances_campo

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/avances", tags=["avances"])


class NuevoAvanceInput(BaseModel):
    iniciativa_id: str | None = None
    necesidad_id: str | None = None
    zona_id: str | None = None
    unidades_entregadas: int = Field(ge=0, default=0)
    progreso_pct: int = Field(ge=0, le=100, default=0)
    notas: str = ""
    evidencia_url: str | None = None


@router.get("/", response_model=list[AvanceCampo])
def get_avances(
    iniciativa_id: str | None = None,
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> list[AvanceCampo]:
    try:
        return listar_avances_campo(iniciativa_id)
    except FirebaseNotConfiguredError:
        logger.info("Firestore no configurado; se devuelve lista de avances vacía")
        return []


@router.post("/", response_model=AvanceCampo, status_code=status.HTTP_201_CREATED)
def post_avance(
    datos: NuevoAvanceInput,
    usuario: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> AvanceCampo:
    avance = AvanceCampo(
        id=f"avc-{uuid.uuid4().hex[:12]}",
        iniciativa_id=datos.iniciativa_id,
        necesidad_id=datos.necesidad_id,
        zona_id=datos.zona_id,
        entidad_id=usuario.uid,
        unidades_entregadas=datos.unidades_entregadas,
        progreso_pct=datos.progreso_pct,
        notas=datos.notas,
        evidencia_url=datos.evidencia_url,
        timestamp=datetime.now(timezone.utc),
    )
    try:
        crear_avance_campo(avance)
        if datos.iniciativa_id and datos.progreso_pct:
            # Reflejar el avance reportado en la iniciativa.
            from app.core.firebase import get_firestore_client

            get_firestore_client().collection("iniciativas").document(datos.iniciativa_id).update(
                {"progreso": round(datos.progreso_pct / 100, 2)}
            )
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    logger.info(
        "Avance de campo %s (iniciativa=%s, %d%%, %d unidades) por %s",
        avance.id,
        datos.iniciativa_id,
        datos.progreso_pct,
        datos.unidades_entregadas,
        usuario.uid,
    )
    return avance
