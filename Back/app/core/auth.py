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

# Mapeo de roles de desarrollo rápido para pruebas locales
DEV_ROLES: dict[str, dict] = {
    "damnificado": {"uid": "usr-damnificado-1", "rol": "damnificado", "nombre": "Damnificado Demo", "email": "damnificado.demo@modus.demo"},
    "usr-damnificado-1": {"uid": "usr-damnificado-1", "rol": "damnificado", "nombre": "Damnificado Demo", "email": "damnificado.demo@modus.demo"},
    "donante": {"uid": "usr-donante-1", "rol": "donante", "nombre": "Postobón S.A.", "email": "donante1.demo@modus.demo"},
    "usr-donante-1": {"uid": "usr-donante-1", "rol": "donante", "nombre": "Postobón S.A.", "email": "donante1.demo@modus.demo"},
    "empresa_beneficiaria": {"uid": "usr-empresa-1", "rol": "empresa_beneficiaria", "nombre": "Cruz Roja Colombiana", "email": "empresa1.demo@modus.demo"},
    "usr-empresa-1": {"uid": "usr-empresa-1", "rol": "empresa_beneficiaria", "nombre": "Cruz Roja Colombiana", "email": "empresa1.demo@modus.demo"},
    "entidad_respuesta": {"uid": "usr-entidad-1", "rol": "entidad_respuesta", "nombre": "UNGRD Coordinación Nacional", "email": "entidad1.demo@modus.demo"},
    "usr-entidad-1": {"uid": "usr-entidad-1", "rol": "entidad_respuesta", "nombre": "UNGRD Coordinación Nacional", "email": "entidad1.demo@modus.demo"},
    "estado": {"uid": "usr-estado-1", "rol": "estado", "nombre": "Estado Colombiano — Panel Nacional", "email": "estado1.demo@modus.demo"},
    "usr-estado-1": {"uid": "usr-estado-1", "rol": "estado", "nombre": "Estado Colombiano — Panel Nacional", "email": "estado1.demo@modus.demo"},
}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Usuario:
    settings = get_settings()

    if credentials is None:
        if settings.environment == "local":
            # En local sin header, otorgar usuario de prueba por defecto para permitir probar directamente en Swagger /docs
            return Usuario(
                uid="usr-damnificado-1",
                rol="damnificado",
                nombre="Damnificado Demo (Local)",
                email="damnificado.demo@modus.demo",
            )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Falta el header Authorization: Bearer <token>")

    raw_token = credentials.credentials.strip()

    # Soporte para tokens de desarrollo rápidos en entorno local: "dev-token:<rol>" o "dev-token:<uid>"
    if settings.environment == "local" and raw_token.startswith("dev-token:"):
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
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "El usuario no tiene un rol asignado (custom claim 'rol' ausente)",
        )

    return Usuario(
        uid=decoded["uid"],
        rol=rol,
        nombre=decoded.get("name", ""),
        email=decoded.get("email", f"{decoded['uid']}@sin-email.local"),
    )


def require_role(*roles_permitidos: Rol):
    """Uso: Depends(require_role("estado", "entidad_respuesta"))"""

    async def _check(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Rol '{usuario.rol}' no autorizado para este endpoint (requiere: {', '.join(roles_permitidos)})",
            )
        return usuario

    return _check
