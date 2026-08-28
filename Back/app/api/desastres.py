"""Sistema de Identificación: endpoint que busca desastres recientes en Colombia
(Google Programmable Search), los **persiste en Firestore** junto con la hora de
la búsqueda (`buscado_en`) y aplica una **caché de 12 h**:

    si ya existe al menos un desastre buscado hace menos de
    `BUSQUEDA_DESASTRES_VENTANA_HORAS` horas  ->  NO se llama a la API,
    se devuelve lo cacheado.

Resiliencia (Regla 2): si Firestore o Google fallan, cae a `data/mock/desastres.json`
y nunca lanza un 5xx sin manejar."""

import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.auth import require_role
from app.core.config import get_settings
from app.core.firebase import FirebaseNotConfiguredError
from app.models.desastre import Desastre
from app.models.usuario import Usuario
from app.services.busqueda_desastres import buscar_desastres
from app.services.repositorio import guardar_desastres, listar_desastres

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/desastres", tags=["desastres"])

_MOCK = Path(__file__).resolve().parents[3] / "data" / "mock" / "desastres.json"


class RespuestaDesastres(BaseModel):
    fuente: Literal["cache", "busqueda", "demo"]
    buscado_en: datetime | None = None  # hora de la búsqueda que produjo estos datos
    total: int
    desastres: list[Desastre]


def _desastres_demo() -> list[Desastre]:
    with _MOCK.open(encoding="utf-8") as archivo:
        return [Desastre(**item) for item in json.load(archivo)]


def _recientes(desastres: list[Desastre], corte: datetime) -> list[Desastre]:
    fresco: list[Desastre] = []
    for d in desastres:
        cuando = d.buscado_en
        if cuando.tzinfo is None:
            cuando = cuando.replace(tzinfo=timezone.utc)
        if cuando >= corte:
            fresco.append(d)
    return fresco


@router.get("/", response_model=RespuestaDesastres)
def get_desastres(
    q: str | None = Query(None, description="Consulta libre; por defecto busca emergencias en Colombia"),
    limite: int = Query(10, ge=1, le=20),
    dias: int = Query(7, ge=0, le=30, description="Restringe a noticias de los últimos N días (0 = sin límite)"),
    forzar: bool = Query(False, description="Ignora la caché de 12 h y vuelve a buscar"),
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> RespuestaDesastres:
    settings = get_settings()
    ahora = datetime.now(timezone.utc)
    corte = ahora - timedelta(hours=settings.busqueda_desastres_ventana_horas)

    # 1) ¿Qué hay ya guardado?
    try:
        cacheados = listar_desastres()
        firestore_ok = True
    except FirebaseNotConfiguredError:
        cacheados = []
        firestore_ok = False

    recientes = _recientes(cacheados, corte)

    # 2) Caché: basta con un solo desastre buscado hace < 12 h para no buscar.
    if recientes and not forzar:
        recientes.sort(key=lambda d: d.buscado_en, reverse=True)
        logger.info("Desastres servidos de caché (%d, búsqueda < %sh)", len(recientes),
                    settings.busqueda_desastres_ventana_horas)
        return RespuestaDesastres(
            fuente="cache",
            buscado_en=max(d.buscado_en for d in recientes),
            total=len(recientes),
            desastres=recientes,
        )

    # 3) Toca buscar en la fuente abierta.
    try:
        encontrados = buscar_desastres(q, limite=limite, dias=dias)
    except RuntimeError as exc:
        logger.warning("Búsqueda de desastres no disponible (%s); se usa %s",
                       exc, "caché" if recientes else "demo")
        if recientes:
            return RespuestaDesastres(
                fuente="cache",
                buscado_en=max(d.buscado_en for d in recientes),
                total=len(recientes),
                desastres=recientes,
            )
        demo = _desastres_demo()
        return RespuestaDesastres(fuente="demo", total=len(demo), desastres=demo)

    for d in encontrados:
        d.buscado_en = ahora

    if firestore_ok and encontrados:
        try:
            guardar_desastres(encontrados)
            logger.info("Guardados %d desastres (buscado_en=%s)", len(encontrados), ahora.isoformat())
        except FirebaseNotConfiguredError:
            logger.info("Firestore no disponible al guardar desastres; se devuelven sin persistir")

    if not encontrados:
        demo = _desastres_demo()
        return RespuestaDesastres(fuente="demo", total=len(demo), desastres=demo)

    return RespuestaDesastres(
        fuente="busqueda",
        buscado_en=ahora,
        total=len(encontrados),
        desastres=encontrados,
    )
