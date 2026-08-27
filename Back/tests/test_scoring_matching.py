"""Prueba aislada de app/services/scoring.py y matching.py, sin Firestore ni Vertex AI."""

from app.models.agentes import RecursoDisponible
from app.models.zona import Zona
from app.services.matching import repartir_recursos
from app.services.scoring import score_urgencia_zona

ZONA_CRITICA = Zona(
    id="z1", nombre="Zona crítica", severidad="critica", sector_necesidad=["agua"], poblacion_afectada=20000
)
ZONA_BAJA = Zona(id="z2", nombre="Zona baja", severidad="baja", sector_necesidad=["agua"], poblacion_afectada=1000)


def test_score_urgencia_zona_critica_mayor_que_baja():
    assert score_urgencia_zona(ZONA_CRITICA) > score_urgencia_zona(ZONA_BAJA)


def test_score_urgencia_en_rango_0_1():
    for zona in (ZONA_CRITICA, ZONA_BAJA):
        assert 0.0 <= score_urgencia_zona(zona) <= 1.0


def test_repartir_recursos_prioriza_zona_mas_urgente():
    ordenes = repartir_recursos([ZONA_CRITICA, ZONA_BAJA], [RecursoDisponible(recurso="agua", cantidad=1000)])
    cantidad_por_zona = {o.zona_id: o.cantidad for o in ordenes}
    assert cantidad_por_zona["z1"] > cantidad_por_zona["z2"]


def test_repartir_recursos_no_excede_cantidad_disponible():
    ordenes = repartir_recursos([ZONA_CRITICA, ZONA_BAJA], [RecursoDisponible(recurso="agua", cantidad=1000)])
    assert sum(o.cantidad for o in ordenes) <= 1000
