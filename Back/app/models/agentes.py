"""Esquemas Pydantic del contrato congelado en docs/contratos_agentes.md.

No modificar sin actualizar ese documento (sección "Cambios") y avisar al equipo.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field

# D1: Estado + Entidad de Respuesta fusionados en un rol para P0 (ver docs/contratos_agentes.md § Cambios).
Rol = Literal["damnificado", "donante", "empresa_beneficiaria", "estado_entidad_respuesta"]


# --- Agente Diagnóstico ---


class DiagnosticoInput(BaseModel):
    imagen_url: str
    zona_id: str


class DiagnosticoOutput(BaseModel):
    zona_id: str
    clasificacion: Literal["destruida", "parcial", "segura"]
    confianza: float = Field(ge=0, le=1)
    resumen: str
    datos_usados: list[str] = Field(default_factory=list)


# --- Agente Priorización ---


class RecursoDisponible(BaseModel):
    recurso: str
    cantidad: float = Field(ge=0)


class PriorizacionInput(BaseModel):
    zonas: list[str]
    recursos_disponibles: list[RecursoDisponible]


class OrdenPriorizada(BaseModel):
    zona_id: str
    recurso: str
    cantidad: float
    score_urgencia: float = Field(ge=0, le=1)
    justificacion: str


class PriorizacionOutput(BaseModel):
    ordenes: list[OrdenPriorizada]
    datos_usados: list[str] = Field(default_factory=list)


# --- Agente Orquestador ---


class OrquestadorInput(BaseModel):
    rol: Rol
    mensaje: str
    contexto_usuario: dict[str, Any] = Field(default_factory=dict)


class OrquestadorOutput(BaseModel):
    respuesta: str
    datos_usados: list[str] = Field(default_factory=list)
    acciones_sugeridas: list[str] = Field(default_factory=list)
