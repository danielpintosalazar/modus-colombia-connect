from datetime import datetime

from pydantic import BaseModel, Field


class OrdenDespliegue(BaseModel):
    id: str
    zona_id: str
    recurso: str
    cantidad: float = Field(gt=0)
    ruta_estimada: str | None = None
    timestamp: datetime
    generado_por_agente_id: str
