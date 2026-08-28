"""Evidencia visual de una zona afectada (fase de análisis / investigación).
Imagen satelital antes/después, aérea, de dron o de terreno, guardada en Cloud
Storage y referenciada en Firestore, con la clasificación del Agente de
Diagnóstico si ya se ejecutó."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TipoEvidencia = Literal["satelital_antes", "satelital_despues", "aerea", "dron", "terreno"]
Clasificacion = Literal["destruida", "parcial", "segura"]


class DiagnosticoEvidencia(BaseModel):
    """Resultado del Agente de Diagnóstico sobre esta imagen."""

    clasificacion: Clasificacion
    confianza: float = Field(ge=0, le=1)
    resumen: str
    modo: str = "vertex_ai_gemini"  # o "fallback_reglas"


class Evidencia(BaseModel):
    id: str
    zona_id: str
    # gs_uri vacío = la imagen vive en una URL externa (no se copió a Storage).
    gs_uri: str = ""
    url: str  # URL de la imagen (firmada de Storage, o URL externa de la fuente)
    origen: Literal["subida", "url_externa"] = "subida"
    tipo: TipoEvidencia
    # Procedencia y licencia — obligatorio dejar constancia (uso de datos abiertos).
    fuente: str = ""       # p. ej. "Copernicus EMS EMSR201", "Sentinel-2", "OpenAerialMap"
    licencia: str = ""     # p. ej. "CC BY 4.0", "Copernicus open data"
    fecha_captura: str | None = None  # fecha de la toma (ISO), distinta al timestamp de carga
    descripcion: str = ""
    diagnostico: DiagnosticoEvidencia | None = None
    creada_por: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
