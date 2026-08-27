"""Carga los datos de demo de data/mock/*.json a Firestore.

Uso:
    python -m scripts.cargar_mock

Requiere GOOGLE_CLOUD_PROJECT y GOOGLE_APPLICATION_CREDENTIALS configurados
(ver .env.example) y que Firestore ya esté inicializado en el proyecto.
"""

import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.firebase import get_firestore_client  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("cargar_mock")

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "mock"

COLECCIONES = {
    "usuarios.json": "usuarios",
    "zonas.json": "zonas",
    "damnificados.json": "damnificados",
    "donaciones.json": "donaciones",
}


def cargar_coleccion(db, archivo: str, coleccion: str) -> int:
    ruta = DATA_DIR / archivo
    if not ruta.exists():
        logger.warning("No existe %s, se omite", ruta)
        return 0

    documentos = json.loads(ruta.read_text(encoding="utf-8"))
    batch = db.batch()
    for doc in documentos:
        ref = db.collection(coleccion).document(doc["id"] if "id" in doc else doc["uid"])
        batch.set(ref, doc)
    batch.commit()
    logger.info("Cargados %d documentos en '%s'", len(documentos), coleccion)
    return len(documentos)


def main() -> None:
    db = get_firestore_client()
    total = 0
    for archivo, coleccion in COLECCIONES.items():
        total += cargar_coleccion(db, archivo, coleccion)
    logger.info("Listo: %d documentos cargados en total.", total)


if __name__ == "__main__":
    main()
