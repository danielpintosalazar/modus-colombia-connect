"""Consulta de zonas — visible para cualquier rol autenticado (monitoreo previo
de zonas afectadas, sección 2 del plan)."""

import json
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.firebase import FirebaseNotConfiguredError
from app.models.usuario import Usuario
from app.models.zona import Zona
from app.services.repositorio import listar_zonas, obtener_zona

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/zonas", tags=["zonas"])


def _zonas_de_demo() -> list[Zona]:
    ruta = Path(__file__).resolve().parents[3] / "data" / "mock" / "zonas.json"
    with ruta.open(encoding="utf-8") as archivo:
        return [Zona(**zona) for zona in json.load(archivo)]


@router.get("/publicas", response_model=list[Zona])
def get_zonas_publicas() -> list[Zona]:
    """Expone el monitoreo agregado que necesita el portal sin autenticación."""
    try:
        return listar_zonas()
    except FirebaseNotConfiguredError:
        logger.info("Firestore no configurado; se sirven zonas de demo para el portal público")
        return _zonas_de_demo()


@router.get("/", response_model=list[Zona])
def get_zonas(_: Usuario = Depends(get_current_user)) -> list[Zona]:
    try:
        return listar_zonas()
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc


@router.get("/{zona_id}", response_model=Zona)
def get_zona(zona_id: str, _: Usuario = Depends(get_current_user)) -> Zona:
    try:
        zona = obtener_zona(zona_id)
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    if zona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Zona '{zona_id}' no encontrada")
    return zona
