"""Crea los usuarios de prueba en Firebase Auth con sus Custom Claims de rol.

Uso:
    python -m scripts.crear_usuarios_auth
"""

import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.firebase import get_auth_client  # noqa: E402
from firebase_admin import auth as fb_auth

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("crear_usuarios_auth")

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "mock"
DEFAULT_PASSWORD = "Password123!"


def crear_o_actualizar_usuario(auth_client, user_data: dict) -> None:
    uid = user_data["uid"]
    email = user_data["email"]
    display_name = user_data.get("nombre", "")
    rol = user_data["rol"]

    try:
        user = auth_client.get_user(uid)
        logger.info("Usuario existente encontrado: %s (%s)", uid, email)
    except fb_auth.UserNotFoundError:
        user = auth_client.create_user(
            uid=uid,
            email=email,
            password=DEFAULT_PASSWORD,
            display_name=display_name,
            email_verified=True,
        )
        logger.info("Usuario creado: %s (%s)", uid, email)

    # Asignar Custom Claim con el rol
    auth_client.set_custom_user_claims(uid, {"rol": rol})
    logger.info("Custom claim 'rol: %s' asignado a %s", rol, uid)


def main() -> None:
    auth_client = get_auth_client()
    archivo_usuarios = DATA_DIR / "usuarios.json"
    if not archivo_usuarios.exists():
        logger.error("No se encontró el archivo %s", archivo_usuarios)
        return

    usuarios = json.loads(archivo_usuarios.read_text(encoding="utf-8"))
    logger.info("Procesando %d usuarios...", len(usuarios))

    for u in usuarios:
        crear_o_actualizar_usuario(auth_client, u)

    logger.info("Todos los usuarios fueron creados/actualizados exitosamente con contraseña por defecto '%s'.", DEFAULT_PASSWORD)


if __name__ == "__main__":
    main()
