"""Métricas agregadas por sector — cálculo directo sobre Firestore, sin
BigQuery en el camino crítico de la demo (PLAN_CLAUDE_CODE.md, Fase 3)."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.firebase import FirebaseNotConfiguredError
from app.models.usuario import Usuario
from app.services.repositorio import listar_donaciones, listar_zonas

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/metricas", tags=["metricas"])


class DeficitSector(BaseModel):
    sector: str
    poblacion_con_necesidad: int
    cantidad_donada: float


class MetricasResponse(BaseModel):
    deficit_por_sector: list[DeficitSector]
    poblacion_afectada_total: int
    zonas_criticas: int


@router.get("/", response_model=MetricasResponse)
def metricas(_: Usuario = Depends(get_current_user)) -> MetricasResponse:
    try:
        zonas = listar_zonas()
        donaciones = listar_donaciones()
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

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
    )
