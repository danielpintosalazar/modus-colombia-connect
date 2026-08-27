from typing import Literal

from pydantic import BaseModel, Field

TipoDonacion = Literal["dinero", "especie", "servicio"]
SectorDonacion = Literal["alimentos", "vivienda", "salud", "agua", "energia", "transporte"]
EstadoDonacion = Literal["pendiente", "asignada", "en_transito", "entregada", "cancelada"]


class Donacion(BaseModel):
    id: str
    donante_id: str
    tipo: TipoDonacion
    sector: SectorDonacion
    cantidad: float = Field(gt=0)
    zona_asignada: str | None = None
    empresa_beneficiaria_id: str | None = None
    estado: EstadoDonacion = "pendiente"
