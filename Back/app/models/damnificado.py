from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

NecesidadPrincipal = Literal[
    "alimentos", "agua", "vivienda", "salud", "energia", "transporte", "otro"
]


class GeoPunto(BaseModel):
    lat: float
    lng: float


class Damnificado(BaseModel):
    id: str
    zona_id: str
    num_familiares: int = Field(ge=1)
    necesidad_principal: NecesidadPrincipal
    ubicacion: GeoPunto
    timestamp: datetime
