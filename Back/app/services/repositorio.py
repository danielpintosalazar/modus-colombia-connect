"""Acceso a Firestore compartido por routers y agentes. Una función por
colección del esquema de docs/PLAN_CLAUDE_CODE.md sección 5 — evita repetir
`db.collection(...).document(...)` con manejo de errores distinto en cada sitio.
"""

import logging

from app.core.firebase import get_firestore_client
from app.models.damnificado import Damnificado
from app.models.donacion import Donacion
from app.models.orden_despliegue import OrdenDespliegue
from app.models.usuario import Usuario
from app.models.zona import Zona

logger = logging.getLogger(__name__)


def listar_zonas(ids: list[str] | None = None) -> list[Zona]:
    db = get_firestore_client()
    if ids:
        docs = (db.collection("zonas").document(zona_id).get() for zona_id in ids)
        return [Zona(**d.to_dict()) for d in docs if d.exists]
    return [Zona(**d.to_dict()) for d in db.collection("zonas").stream()]


def obtener_zona(zona_id: str) -> Zona | None:
    doc = get_firestore_client().collection("zonas").document(zona_id).get()
    return Zona(**doc.to_dict()) if doc.exists else None


def listar_damnificados(zona_id: str | None = None) -> list[Damnificado]:
    db = get_firestore_client()
    query = db.collection("damnificados")
    if zona_id:
        query = query.where("zona_id", "==", zona_id)
    return [Damnificado(**d.to_dict()) for d in query.stream()]


def crear_damnificado(damnificado: Damnificado) -> None:
    get_firestore_client().collection("damnificados").document(damnificado.id).set(damnificado.model_dump(mode="json"))


def listar_donaciones(donante_id: str | None = None) -> list[Donacion]:
    db = get_firestore_client()
    query = db.collection("donaciones")
    if donante_id:
        query = query.where("donante_id", "==", donante_id)
    return [Donacion(**d.to_dict()) for d in query.stream()]


def crear_donacion(donacion: Donacion) -> None:
    get_firestore_client().collection("donaciones").document(donacion.id).set(donacion.model_dump(mode="json"))


def guardar_ordenes_despliegue(ordenes: list[OrdenDespliegue]) -> None:
    db = get_firestore_client()
    batch = db.batch()
    for orden in ordenes:
        batch.set(db.collection("ordenes_despliegue").document(orden.id), orden.model_dump(mode="json"))
    batch.commit()


def obtener_usuario(uid: str) -> Usuario | None:
    doc = get_firestore_client().collection("usuarios").document(uid).get()
    return Usuario(**doc.to_dict()) if doc.exists else None
