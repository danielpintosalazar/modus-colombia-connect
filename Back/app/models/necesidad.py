"""D4 (rectificar_verificar.md): entidad `necesidades` con trazabilidad de fuente.
Un objeto `necesidad` puede crearse manualmente, por el Agente de Diagnóstico o por
el sistema de identificación de riesgo — y siempre debe registrar de dónde salió.
Versión P0 simplificada."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# De dónde salió la necesidad (requisito no funcional: trazabilidad de origen).
FuenteNecesidad = Literal["manual", "agente_diagnostico", "sistema_riesgo"]
EstadoNecesidad = Literal["abierta", "vinculada", "cubierta", "cerrada"]


class Necesidad(BaseModel):
    id: str
    zona_id: str
    tipo_necesidad: str
    fuente: FuenteNecesidad
    estado: EstadoNecesidad = "abierta"
    # uid de la entidad (estado_entidad_respuesta) que se vinculó a esta necesidad.
    entidad_vinculada_id: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
