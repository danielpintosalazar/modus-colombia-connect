"""D3 (rectificar_verificar.md): entidad `iniciativas`, concepto central del portal
público y del catálogo del donante. Versión P0 mínima — SIN fotos antes/después ni
insights de inversión (eso es P1/P2)."""

from typing import Literal

from pydantic import BaseModel, Field

from app.models.zona import Sector

EstadoIniciativa = Literal["propuesta", "en_ejecucion", "concluida"]


class Iniciativa(BaseModel):
    id: str
    titulo: str
    descripcion: str
    zona_id: str
    sector: Sector
    # Entidad responsable de ejecutar la iniciativa (uid de usuarios/).
    entidad_responsable_id: str
    # Actores participantes (uids de usuarios/ o siglas para la demo).
    actores: list[str] = Field(default_factory=list)
    poblacion_impactada: int = Field(ge=0)
    meta: str
    progreso: float = Field(ge=0, le=1, default=0.0)
    estado: EstadoIniciativa = "propuesta"
