"""Inicialización perezosa del Firebase Admin SDK.

No falla al importar si no hay credenciales configuradas (p. ej. en desarrollo
local antes de completar el login manual de `gcloud`/`firebase`, ver
docs/decisiones_tecnicas.md). Cualquier código que necesite Firestore/Auth/Storage
debe pasar por get_firestore_client() / get_auth_client() / get_storage_bucket(),
que sí lanzan un error explícito y claro en el momento de uso si falta la
inicialización — nunca un fallo silencioso.
"""

import logging

import firebase_admin
from firebase_admin import auth, credentials, firestore, storage

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_app: firebase_admin.App | None = None


class FirebaseNotConfiguredError(RuntimeError):
    """El Admin SDK no pudo inicializarse (credenciales ausentes o inválidas)."""


def init_firebase() -> firebase_admin.App | None:
    """Inicializa el Admin SDK una sola vez. Devuelve None si no hay credenciales."""
    global _app
    if _app is not None:
        return _app

    settings = get_settings()
    if not settings.has_google_credentials:
        logger.warning(
            "GOOGLE_CLOUD_PROJECT no configurado — Firebase Admin SDK no se inicializa. "
            "Endpoints que dependan de Firestore/Auth/Storage fallarán de forma controlada."
        )
        return None

    try:
        cred = credentials.ApplicationDefault()
        _app = firebase_admin.initialize_app(
            cred,
            {
                "projectId": settings.google_cloud_project,
                "storageBucket": settings.firebase_storage_bucket or None,
            },
        )
        logger.info("Firebase Admin SDK inicializado para el proyecto %s", settings.google_cloud_project)
    except Exception:
        logger.exception("No se pudo inicializar Firebase Admin SDK")
        _app = None

    return _app


def get_firestore_client() -> firestore.Client:
    if init_firebase() is None:
        raise FirebaseNotConfiguredError("Firestore no disponible: Firebase Admin SDK no está inicializado.")
    return firestore.client()


def get_auth_client():
    if init_firebase() is None:
        raise FirebaseNotConfiguredError("Firebase Auth no disponible: Firebase Admin SDK no está inicializado.")
    return auth


def get_storage_bucket():
    if init_firebase() is None:
        raise FirebaseNotConfiguredError("Firebase Storage no disponible: Firebase Admin SDK no está inicializado.")
    return storage.bucket()
