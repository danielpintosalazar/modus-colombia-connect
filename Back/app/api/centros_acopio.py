"""Centros de acopio: puntos de recolección con entidades presentes, capacidad y
vigencia. Lectura pública (el portal los muestra) con fallback a JSON; alta solo
para el rol `estado_entidad_respuesta`."""

import json
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import require_role
from app.core.firebase import FirebaseNotConfiguredError
from app.models.operaciones import CentroAcopio
from app.models.usuario import Usuario
from app.services.repositorio import crear_centro_acopio, listar_centros_acopio

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/centros-acopio", tags=["centros-acopio"])


def _centros_de_demo() -> list[CentroAcopio]:
    ruta = Path(__file__).resolve().parents[3] / "data" / "mock" / "centros_acopio.json"
    if not ruta.exists():
        return []
    with ruta.open(encoding="utf-8") as archivo:
        return [CentroAcopio(**item) for item in json.load(archivo)]


@router.get("/", response_model=list[CentroAcopio])
def get_centros() -> list[CentroAcopio]:
    try:
        centros = listar_centros_acopio()
        return centros or _centros_de_demo()
    except FirebaseNotConfiguredError:
        logger.info("Firestore no configurado; se sirven centros de acopio de demo")
        return _centros_de_demo()


class NuevoCentroInput(BaseModel):
    nombre: str
    ciudad: str
    entidades: list[str] = Field(default_factory=list)
    capacidad: str = "Por definir"
    vigencia: str = "Vigencia abierta"
    zona_id: str | None = None


@router.post("/", response_model=CentroAcopio, status_code=status.HTTP_201_CREATED)
def post_centro(
    datos: NuevoCentroInput,
    usuario: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> CentroAcopio:
    centro = CentroAcopio(
        id=f"ca-{uuid.uuid4().hex[:10]}",
        nombre=datos.nombre,
        ciudad=datos.ciudad,
        entidades=datos.entidades,
        capacidad=datos.capacidad,
        vigencia=datos.vigencia,
        zona_id=datos.zona_id,
    )
    try:
        crear_centro_acopio(centro)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    logger.info("Nuevo centro de acopio %s (%s) por %s", centro.id, centro.ciudad, usuario.uid)
    return centro
