"""Dependencia de FastAPI que valida el ID token de Firebase Auth y extrae el rol
desde los custom claims. No implementa autenticación propia (prohibido, ver
PLAN_CLAUDE_CODE.md sección 9) — delega toda la validación a Firebase Auth.
"""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import FirebaseNotConfiguredError, get_auth_client
from app.models.usuario import Rol, Usuario

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)

# Entornos sin Firebase Auth real donde se aceptan los tokens "dev-token:<rol>" y
# el usuario de prueba por defecto (incluye el contenedor de la demo, ENVIRONMENT=docker).
_ENTORNOS_DEV = {"local", "docker", "dev", "development"}


def _es_entorno_dev(environment: str) -> bool:
    return environment.lower() in _ENTORNOS_DEV

# Mapeo de roles de desarrollo rápido para pruebas locales
DEV_ROLES: dict[str, dict] = {
    "damnificado": {"uid": "usr-damnificado-1", "rol": "damnificado", "nombre": "Damnificado Demo", "email": "damnificado.demo@modus.demo"},
    "usr-damnificado-1": {"uid": "usr-damnificado-1", "rol": "damnificado", "nombre": "Damnificado Demo", "email": "damnificado.demo@modus.demo"},
    "donante": {"uid": "usr-donante-1", "rol": "donante", "nombre": "Postobón S.A.", "email": "donante1.demo@modus.demo"},
    "usr-donante-1": {"uid": "usr-donante-1", "rol": "donante", "nombre": "Postobón S.A.", "email": "donante1.demo@modus.demo"},
    "empresa_beneficiaria": {"uid": "usr-empresa-1", "rol": "empresa_beneficiaria", "nombre": "Cruz Roja Colombiana", "email": "empresa1.demo@modus.demo"},
    "usr-empresa-1": {"uid": "usr-empresa-1", "rol": "empresa_beneficiaria", "nombre": "Cruz Roja Colombiana", "email": "empresa1.demo@modus.demo"},
    # D1: Estado + Entidad de Respuesta fusionados. Se conservan las claves antiguas
    # ("estado", "entidad_respuesta", "usr-estado-1", "usr-entidad-1") como alias del
    # rol combinado para no romper tokens de desarrollo ni la guía de verificación.
    "estado_entidad_respuesta": {"uid": "usr-estado-entidad-1", "rol": "estado_entidad_respuesta", "nombre": "Estado / Entidad de Respuesta — Panel Consolidado", "email": "estado.entidad.demo@modus.demo"},
    "usr-estado-entidad-1": {"uid": "usr-estado-entidad-1", "rol": "estado_entidad_respuesta", "nombre": "Estado / Entidad de Respuesta — Panel Consolidado", "email": "estado.entidad.demo@modus.demo"},
    "entidad_respuesta": {"uid": "usr-estado-entidad-1", "rol": "estado_entidad_respuesta", "nombre": "Estado / Entidad de Respuesta — Panel Consolidado", "email": "estado.entidad.demo@modus.demo"},
    "usr-entidad-1": {"uid": "usr-estado-entidad-1", "rol": "estado_entidad_respuesta", "nombre": "Estado / Entidad de Respuesta — Panel Consolidado", "email": "estado.entidad.demo@modus.demo"},
    "estado": {"uid": "usr-estado-entidad-1", "rol": "estado_entidad_respuesta", "nombre": "Estado / Entidad de Respuesta — Panel Consolidado", "email": "estado.entidad.demo@modus.demo"},
    "usr-estado-1": {"uid": "usr-estado-entidad-1", "rol": "estado_entidad_respuesta", "nombre": "Estado / Entidad de Respuesta — Panel Consolidado", "email": "estado.entidad.demo@modus.demo"},
}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Usuario:
    settings = get_settings()

    if credentials is None:
        if _es_entorno_dev(settings.environment):
            # Sin header en entorno dev: usuario de prueba por defecto (Swagger /docs, demo).
            return Usuario(
                uid="usr-damnificado-1",
                rol="damnificado",
                nombre="Damnificado Demo (Local)",
                email="damnificado.demo@modus.demo",
            )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Falta el header Authorization: Bearer <token>")

    raw_token = credentials.credentials.strip()

    # Tokens de desarrollo rápidos ("dev-token:<rol>" o "dev-token:<uid>") en entornos dev.
    if _es_entorno_dev(settings.environment) and raw_token.startswith("dev-token:"):
        token_key = raw_token.split("dev-token:", 1)[1].strip()
        dev_info = DEV_ROLES.get(token_key, DEV_ROLES["damnificado"])
        return Usuario(
            uid=dev_info["uid"],
            rol=dev_info["rol"],
            nombre=dev_info["nombre"],
            email=dev_info["email"],
        )

    try:
        auth_client = get_auth_client()
    except FirebaseNotConfiguredError as exc:
        logger.error("Intento de autenticación sin Firebase configurado")
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    try:
        decoded = auth_client.verify_id_token(raw_token)
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de Firebase inválido o expirado") from exc

    rol = decoded.get("rol")

    if rol is None:
        # El custom claim 'rol' no está puesto todavía. Se intenta resolver desde
        # el documento usuarios/{uid} en Firestore antes de rechazar (así el login
        # funciona aunque no se haya corrido scripts/crear_usuarios_auth.py).
        try:
            from app.services.repositorio import obtener_usuario

            usuario_db = obtener_usuario(decoded["uid"])
        except Exception:  # noqa: BLE001 — cualquier fallo de Firestore no debe tumbar el login
            usuario_db = None
        if usuario_db is not None:
            rol = usuario_db.rol

    if rol is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "El usuario autenticado no tiene rol asignado. Ejecuta "
            "`python -m scripts.crear_usuarios_auth` o crea su documento en usuarios/{uid}.",
        )

    return Usuario(
        uid=decoded["uid"],
        rol=rol,
        nombre=decoded.get("name", ""),
        email=decoded.get("email", f"{decoded['uid']}@sin-email.local"),
    )


def require_role(*roles_permitidos: Rol):
    """Uso: Depends(require_role("estado_entidad_respuesta"))"""

    async def _check(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Rol '{usuario.rol}' no autorizado para este endpoint (requiere: {', '.join(roles_permitidos)})",
            )
        return usuario

    return _check
