"""Entidad `desastres`: eventos de emergencia detectados por el Sistema de
Identificación a partir de fuentes abiertas (noticias vía Google Programmable
Search). Cada documento guarda de qué búsqueda salió y **a qué hora se buscó**
(`buscado_en`) para poder cachear: si ya hay un desastre buscado hace menos de
12 h no se vuelve a llamar a la API (ver `app/services/busqueda_desastres.py`)."""

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

# Clasificación heurística del evento (regex sobre título + resumen).
TipoDesastre = Literal[
    "sismo",
    "inundacion",
    "deslizamiento",
    "incendio",
    "vendaval",
    "erupcion",
    "otro",
]


class Desastre(BaseModel):
    id: str
    titulo: str
    descripcion: str = ""
    url: str = ""            # enlace a la noticia / fuente original
    fuente: str = ""         # dominio del medio (displayLink)
    imagen: str | None = None
    lugar: str = ""          # texto libre (municipio / departamento) si se detecta
    tipo: TipoDesastre = "otro"
    consulta: str = ""       # query que lo encontró
    publicado: str | None = None  # fecha de la noticia si viene en el snippet/pagemap
    # Hora a la que se ejecutó la búsqueda que trajo este desastre. Es la clave
    # de la caché de 12 h — no confundir con `publicado` (fecha del hecho).
    buscado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
