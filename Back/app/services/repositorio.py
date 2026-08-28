"""Acceso a Firestore compartido por routers y agentes. Una función por
colección del esquema de docs/PLAN_CLAUDE_CODE.md sección 5 — evita repetir
`db.collection(...).document(...)` con manejo de errores distinto en cada sitio.
"""

import logging

from app.core.firebase import get_firestore_client
from app.models.damnificado import Damnificado
from app.models.desastre import Desastre
from app.models.donacion import Donacion
from app.models.evidencia import Evidencia
from app.models.iniciativa import Iniciativa
from app.models.necesidad import Necesidad
from app.models.operaciones import AvanceCampo, CentroAcopio, NotificacionEntidad
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


# --- D3: iniciativas ---


def listar_iniciativas(zona_id: str | None = None) -> list[Iniciativa]:
    db = get_firestore_client()
    query = db.collection("iniciativas")
    if zona_id:
        query = query.where("zona_id", "==", zona_id)
    return [Iniciativa(**d.to_dict()) for d in query.stream()]


def crear_iniciativa(iniciativa: Iniciativa) -> None:
    get_firestore_client().collection("iniciativas").document(iniciativa.id).set(iniciativa.model_dump(mode="json"))


# --- D4: necesidades ---


def listar_necesidades(zona_id: str | None = None) -> list[Necesidad]:
    db = get_firestore_client()
    query = db.collection("necesidades")
    if zona_id:
        query = query.where("zona_id", "==", zona_id)
    return [Necesidad(**d.to_dict()) for d in query.stream()]


def crear_necesidad(necesidad: Necesidad) -> None:
    get_firestore_client().collection("necesidades").document(necesidad.id).set(necesidad.model_dump(mode="json"))


def obtener_necesidad(necesidad_id: str) -> Necesidad | None:
    doc = get_firestore_client().collection("necesidades").document(necesidad_id).get()
    return Necesidad(**doc.to_dict()) if doc.exists else None


def actualizar_necesidad(necesidad_id: str, cambios: dict) -> None:
    get_firestore_client().collection("necesidades").document(necesidad_id).update(cambios)


# --- Operaciones de campo (avances, notificaciones, centros de acopio) ---


def crear_avance_campo(avance: AvanceCampo) -> None:
    get_firestore_client().collection("avances_campo").document(avance.id).set(avance.model_dump(mode="json"))


def listar_avances_campo(iniciativa_id: str | None = None) -> list[AvanceCampo]:
    db = get_firestore_client()
    query = db.collection("avances_campo")
    if iniciativa_id:
        query = query.where("iniciativa_id", "==", iniciativa_id)
    return [AvanceCampo(**d.to_dict()) for d in query.stream()]


def crear_notificacion_entidad(notificacion: NotificacionEntidad) -> None:
    get_firestore_client().collection("notificaciones_entidad").document(notificacion.id).set(
        notificacion.model_dump(mode="json")
    )


def listar_notificaciones_entidad() -> list[NotificacionEntidad]:
    db = get_firestore_client()
    return [NotificacionEntidad(**d.to_dict()) for d in db.collection("notificaciones_entidad").stream()]


def crear_centro_acopio(centro: CentroAcopio) -> None:
    get_firestore_client().collection("centros_acopio").document(centro.id).set(centro.model_dump(mode="json"))


def listar_centros_acopio() -> list[CentroAcopio]:
    db = get_firestore_client()
    return [CentroAcopio(**d.to_dict()) for d in db.collection("centros_acopio").stream()]


# --- Evidencias visuales (fase de análisis) ---


def crear_evidencia(evidencia: Evidencia) -> None:
    get_firestore_client().collection("evidencias").document(evidencia.id).set(evidencia.model_dump(mode="json"))


def obtener_evidencia(evidencia_id: str) -> Evidencia | None:
    doc = get_firestore_client().collection("evidencias").document(evidencia_id).get()
    return Evidencia(**doc.to_dict()) if doc.exists else None


def listar_evidencias(zona_id: str | None = None) -> list[Evidencia]:
    db = get_firestore_client()
    query = db.collection("evidencias")
    if zona_id:
        query = query.where("zona_id", "==", zona_id)
    return [Evidencia(**d.to_dict()) for d in query.stream()]


def actualizar_evidencia(evidencia_id: str, cambios: dict) -> None:
    get_firestore_client().collection("evidencias").document(evidencia_id).update(cambios)


# --- Desastres (Sistema de Identificación: búsqueda en fuentes abiertas) ---


def listar_desastres() -> list[Desastre]:
    """Todos los desastres cacheados. El filtro por `buscado_en` (ventana de 12 h)
    se hace en el endpoint — la colección es pequeña (cada búsqueda escribe ≤10
    docs y los reescribe por id derivado de la URL)."""
    db = get_firestore_client()
    return [Desastre(**d.to_dict()) for d in db.collection("desastres").stream()]


def guardar_desastres(desastres: list[Desastre]) -> None:
    """Upsert en lote. El id es un hash de la URL, así que re-buscar el mismo
    evento actualiza su `buscado_en` en vez de duplicarlo."""
    db = get_firestore_client()
    batch = db.batch()
    for desastre in desastres:
        batch.set(db.collection("desastres").document(desastre.id), desastre.model_dump(mode="json"))
    batch.commit()
