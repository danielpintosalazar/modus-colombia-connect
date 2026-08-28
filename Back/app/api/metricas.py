"""Métricas agregadas por sector — cálculo directo sobre Firestore, sin
BigQuery en el camino crítico de la demo (PLAN_CLAUDE_CODE.md, Fase 3).

Si Firestore no está configurado se calcula sobre data/mock/ para que el panel
del portal y del rol estado_entidad_respuesta nunca quede vacío en la demo."""

import json
import logging
from pathlib import Path

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.firebase import FirebaseNotConfiguredError
from app.models.donacion import Donacion
from app.models.usuario import Usuario
from app.models.zona import Zona
from app.services.repositorio import listar_donaciones, listar_zonas

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/metricas", tags=["metricas"])

_MOCK_DIR = Path(__file__).resolve().parents[3] / "data" / "mock"


class DeficitSector(BaseModel):
    sector: str
    poblacion_con_necesidad: int
    cantidad_donada: float


class MetricasResponse(BaseModel):
    deficit_por_sector: list[DeficitSector]
    poblacion_afectada_total: int
    zonas_criticas: int
    fuente: str = "firestore"


def _calcular(zonas: list[Zona], donaciones: list[Donacion], fuente: str) -> MetricasResponse:
    poblacion_por_sector: dict[str, int] = {}
    for zona in zonas:
        for sector in zona.sector_necesidad:
            poblacion_por_sector[sector] = poblacion_por_sector.get(sector, 0) + zona.poblacion_afectada

    donado_por_sector: dict[str, float] = {}
    for donacion in donaciones:
        donado_por_sector[donacion.sector] = donado_por_sector.get(donacion.sector, 0) + donacion.cantidad

    deficit = [
        DeficitSector(
            sector=sector,
            poblacion_con_necesidad=poblacion,
            cantidad_donada=donado_por_sector.get(sector, 0),
        )
        for sector, poblacion in poblacion_por_sector.items()
    ]

    return MetricasResponse(
        deficit_por_sector=deficit,
        poblacion_afectada_total=sum(z.poblacion_afectada for z in zonas),
        zonas_criticas=sum(1 for z in zonas if z.severidad == "critica"),
        fuente=fuente,
    )


def _metricas_de_demo() -> MetricasResponse:
    with (_MOCK_DIR / "zonas.json").open(encoding="utf-8") as f:
        zonas = [Zona(**z) for z in json.load(f)]
    with (_MOCK_DIR / "donaciones.json").open(encoding="utf-8") as f:
        donaciones = [Donacion(**d) for d in json.load(f)]
    return _calcular(zonas, donaciones, fuente="demo")


@router.get("/", response_model=MetricasResponse)
def metricas(_: Usuario = Depends(get_current_user)) -> MetricasResponse:
    try:
        return _calcular(listar_zonas(), listar_donaciones(), fuente="firestore")
    except FirebaseNotConfiguredError:
        logger.info("Firestore no configurado; se calculan métricas sobre data/mock/")
        return _metricas_de_demo()
