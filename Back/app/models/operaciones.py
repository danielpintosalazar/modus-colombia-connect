"""Modelos de operación en campo del rol `estado_entidad_respuesta`:
avances de intervención, notificaciones a entidades y centros de acopio."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# --- Avance de campo (reporte de entregas / progreso de una intervención) ---


class AvanceCampo(BaseModel):
    id: str
    # Referencia opcional a lo que se está atendiendo.
    iniciativa_id: str | None = None
    necesidad_id: str | None = None
    zona_id: str | None = None
    entidad_id: str
    unidades_entregadas: int = Field(ge=0, default=0)
    progreso_pct: int = Field(ge=0, le=100, default=0)
    notas: str = ""
    evidencia_url: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now())


# --- Notificación de participación requerida a una entidad del Estado ---

EstadoNotificacion = Literal["enviada", "aceptada", "rechazada"]


class NotificacionEntidad(BaseModel):
    id: str
    entidad_nombre: str
    zona_id: str | None = None
    emergencia_id: str | None = None
    motivo: str
    estado: EstadoNotificacion = "enviada"
    emitida_por: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now())


# --- Centro de acopio ---


class CentroAcopio(BaseModel):
    id: str
    nombre: str
    ciudad: str
    entidades: list[str] = Field(default_factory=list)
    capacidad: str = "Por definir"
    vigencia: str = "Vigencia abierta"
    zona_id: str | None = None
    ubicacion: dict | None = None  # {lat, lng} opcional
