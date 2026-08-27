"""Dependencia de FastAPI que valida el ID token de Firebase Auth y extrae el rol
desde los custom claims. No implementa autenticación propia (prohibido, ver
PLAN_CLAUDE_CODE.md sección 9) — delega toda la validación a Firebase Auth.
"""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import FirebaseNotConfiguredError, get_auth_client
from app.models.usuario import Rol, Usuario

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Usuario:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Falta el header Authorization: Bearer <token>")

    try:
        auth_client = get_auth_client()
    except FirebaseNotConfiguredError as exc:
        logger.error("Intento de autenticación sin Firebase configurado")
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    try:
        decoded = auth_client.verify_id_token(credentials.credentials)
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
