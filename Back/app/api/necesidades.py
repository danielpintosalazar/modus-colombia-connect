"""D4 (rectificar_verificar.md): catálogo de necesidades con trazabilidad de
origen. Lo consume el rol fusionado `estado_entidad_respuesta` (catálogo
filtrable + vincularse a una). Fallback a data/mock/necesidades.json."""

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.auth import require_role
from app.core.firebase import FirebaseNotConfiguredError
from app.models.necesidad import EstadoNecesidad, FuenteNecesidad, Necesidad
from app.models.usuario import Usuario
from app.services.repositorio import (
    actualizar_necesidad,
    crear_necesidad,
    listar_necesidades,
    obtener_necesidad,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/necesidades", tags=["necesidades"])


def _necesidades_de_demo() -> list[Necesidad]:
    ruta = Path(__file__).resolve().parents[3] / "data" / "mock" / "necesidades.json"
    with ruta.open(encoding="utf-8") as archivo:
        return [Necesidad(**item) for item in json.load(archivo)]


@router.get("/", response_model=list[Necesidad])
def get_necesidades(
    zona_id: str | None = None,
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> list[Necesidad]:
    try:
        return listar_necesidades(zona_id)
    except FirebaseNotConfiguredError:
        logger.info("Firestore no configurado; se sirven necesidades de demo")
        datos = _necesidades_de_demo()
        return [n for n in datos if zona_id is None or n.zona_id == zona_id]


class NuevaNecesidadInput(BaseModel):
    zona_id: str
    tipo_necesidad: str
    fuente: FuenteNecesidad = "manual"


@router.post("/", response_model=Necesidad, status_code=status.HTTP_201_CREATED)
def post_necesidad(
    datos: NuevaNecesidadInput,
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> Necesidad:
    necesidad = Necesidad(
        id=str(uuid.uuid4()),
        zona_id=datos.zona_id,
        tipo_necesidad=datos.tipo_necesidad,
        fuente=datos.fuente,
        timestamp=datetime.now(timezone.utc),
    )
    try:
        crear_necesidad(necesidad)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    logger.info("Nueva necesidad %s en zona %s (fuente=%s)", necesidad.id, necesidad.zona_id, necesidad.fuente)
    return necesidad


class ActualizarNecesidadInput(BaseModel):
    estado: EstadoNecesidad | None = None
    vincular: bool | None = None  # true = vincular al usuario actual; false = desvincular


@router.patch("/{necesidad_id}", response_model=Necesidad)
def patch_necesidad(
    necesidad_id: str,
    datos: ActualizarNecesidadInput,
    usuario: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> Necesidad:
    """Vincular la necesidad a la entidad actual y/o cambiar su estado."""
    try:
        actual = obtener_necesidad(necesidad_id)
        if actual is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Necesidad '{necesidad_id}' no encontrada")

        cambios: dict = {}
        if datos.vincular is True:
            cambios["entidad_vinculada_id"] = usuario.uid
            cambios["estado"] = datos.estado or "vinculada"
        elif datos.vincular is False:
            cambios["entidad_vinculada_id"] = None
        if datos.estado is not None:
            cambios["estado"] = datos.estado

        if cambios:
            actualizar_necesidad(necesidad_id, cambios)
        return obtener_necesidad(necesidad_id) or actual
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
