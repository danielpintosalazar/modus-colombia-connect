from typing import Literal

from pydantic import BaseModel, Field

Severidad = Literal["critica", "media", "baja"]
Sector = Literal["alimentos", "vivienda", "salud", "agua", "energia", "transporte"]


class GeoPuntoSimplificado(BaseModel):
    """Fallback cuando no hay geojson: centro + radio en km."""

    lat: float
    lng: float
    radio_km: float = Field(gt=0)


class Zona(BaseModel):
    id: str
    nombre: str
    geojson_simplificado: dict | None = None
    ubicacion: GeoPuntoSimplificado | None = None
    severidad: Severidad
    sector_necesidad: list[Sector]
    poblacion_afectada: int = Field(ge=0)
