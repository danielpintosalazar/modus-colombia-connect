"""D3 (rectificar_verificar.md): catálogo de iniciativas — concepto central del
portal público y del catálogo del donante. Lectura pública para el portal, con
fallback a data/mock/iniciativas.json si Firestore no está configurado."""

import json
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user, require_role
from app.core.firebase import FirebaseNotConfiguredError
from app.models.iniciativa import EstadoIniciativa, Iniciativa
from app.models.usuario import Usuario
from app.models.zona import Sector
from app.services.repositorio import crear_iniciativa, listar_iniciativas

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/iniciativas", tags=["iniciativas"])


def _iniciativas_de_demo() -> list[Iniciativa]:
    ruta = Path(__file__).resolve().parents[3] / "data" / "mock" / "iniciativas.json"
    with ruta.open(encoding="utf-8") as archivo:
        return [Iniciativa(**item) for item in json.load(archivo)]


@router.get("/publicas", response_model=list[Iniciativa])
def get_iniciativas_publicas() -> list[Iniciativa]:
    """Catálogo para el portal público — sin autenticación."""
    try:
        return listar_iniciativas()
    except FirebaseNotConfiguredError:
        logger.info("Firestore no configurado; se sirven iniciativas de demo para el portal público")
        return _iniciativas_de_demo()


@router.get("/", response_model=list[Iniciativa])
def get_iniciativas(
    zona_id: str | None = None,
    _: Usuario = Depends(get_current_user),
) -> list[Iniciativa]:
    try:
        return listar_iniciativas(zona_id)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc


class NuevaIniciativaInput(BaseModel):
    titulo: str
    descripcion: str
    zona_id: str
    sector: Sector
    poblacion_impactada: int = Field(ge=0)
    meta: str
    actores: list[str] = Field(default_factory=list)
    estado: EstadoIniciativa = "propuesta"


@router.post("/", response_model=Iniciativa, status_code=status.HTTP_201_CREATED)
def post_iniciativa(
    datos: NuevaIniciativaInput,
    usuario: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> Iniciativa:
    """Publicar una iniciativa / campaña de apoyo (rol estado_entidad_respuesta)."""
    iniciativa = Iniciativa(
        id=f"ini-{uuid.uuid4().hex[:12]}",
        titulo=datos.titulo,
        descripcion=datos.descripcion,
        zona_id=datos.zona_id,
        sector=datos.sector,
        entidad_responsable_id=usuario.uid,
        actores=datos.actores,
        poblacion_impactada=datos.poblacion_impactada,
        meta=datos.meta,
        progreso=0.0,
        estado=datos.estado,
    )
    try:
        crear_iniciativa(iniciativa)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    logger.info("Nueva iniciativa %s en zona %s por %s", iniciativa.id, iniciativa.zona_id, usuario.uid)
    return iniciativa
