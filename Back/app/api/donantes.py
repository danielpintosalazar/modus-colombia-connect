import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import require_role
from app.core.firebase import FirebaseNotConfiguredError
from app.models.donacion import Donacion, EstadoDonacion, SectorDonacion, TipoDonacion
from app.models.usuario import Usuario
from app.services.repositorio import crear_donacion, listar_donaciones

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/donaciones", tags=["donantes"])


class CrearDonacionInput(BaseModel):
    tipo: TipoDonacion
    sector: SectorDonacion
    cantidad: float = Field(gt=0)
    zona_asignada: str | None = None
    empresa_beneficiaria_id: str | None = None


@router.post("/", response_model=Donacion, status_code=status.HTTP_201_CREATED)
def crear(
    datos: CrearDonacionInput,
    usuario: Usuario = Depends(require_role("donante")),
) -> Donacion:
    donacion = Donacion(
        id=str(uuid.uuid4()),
        donante_id=usuario.uid,
        tipo=datos.tipo,
        sector=datos.sector,
        cantidad=datos.cantidad,
        zona_asignada=datos.zona_asignada,
        empresa_beneficiaria_id=datos.empresa_beneficiaria_id,
        estado="pendiente",
    )
    try:
        crear_donacion(donacion)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    logger.info("Nueva donación %s de donante %s", donacion.id, usuario.uid)
    return donacion


@router.get("/mias", response_model=list[Donacion])
def mis_donaciones(usuario: Usuario = Depends(require_role("donante"))) -> list[Donacion]:
    try:
        return listar_donaciones(donante_id=usuario.uid)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
