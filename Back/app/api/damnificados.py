import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import require_role
from app.core.firebase import FirebaseNotConfiguredError
from app.models.damnificado import Damnificado, GeoPunto, NecesidadPrincipal
from app.models.usuario import Usuario
from app.services.repositorio import crear_damnificado, listar_damnificados
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/damnificados", tags=["damnificados"])


class ReporteDamnificadoInput(BaseModel):
    zona_id: str
    num_familiares: int = Field(ge=1)
    necesidad_principal: NecesidadPrincipal
    ubicacion: GeoPunto


@router.post("/", response_model=Damnificado, status_code=status.HTTP_201_CREATED)
def reportar_damnificado(
    datos: ReporteDamnificadoInput,
    usuario: Usuario = Depends(require_role("damnificado")),
) -> Damnificado:
    damnificado = Damnificado(
        id=str(uuid.uuid4()),
        zona_id=datos.zona_id,
        num_familiares=datos.num_familiares,
        necesidad_principal=datos.necesidad_principal,
        ubicacion=datos.ubicacion,
        timestamp=datetime.now(timezone.utc),
    )
    try:
        crear_damnificado(damnificado)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    logger.info("Nuevo reporte de damnificado %s en zona %s (usuario=%s)", damnificado.id, damnificado.zona_id, usuario.uid)
    return damnificado


@router.get("/", response_model=list[Damnificado])
def listar(
    zona_id: str | None = None,
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> list[Damnificado]:
    try:
        return listar_damnificados(zona_id)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
