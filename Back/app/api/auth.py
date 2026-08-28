"""Endpoint de identidad. Devuelve el Usuario resuelto del token actual —sea un
ID token real de Firebase Auth o un dev-token— para que el frontend sepa qué rol
tiene tras iniciar sesión. La validación real vive en app/core/auth.py."""

import logging

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.usuario import Usuario

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=Usuario)
def me(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    return usuario


@router.get("/config")
def auth_config() -> dict:
    """Pista para el frontend sobre cómo está operando la auth del backend.

    No expone secretos: solo si el backend está en modo dev (acepta dev-token) o
    exige ID tokens reales de Firebase.
    """
    settings = get_settings()
    from app.core.auth import _es_entorno_dev

    return {
        "environment": settings.environment,
        "acepta_dev_token": _es_entorno_dev(settings.environment),
        "firebase_project_id": settings.google_cloud_project or None,
    }
