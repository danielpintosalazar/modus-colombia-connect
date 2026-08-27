"""Fallback simulado por reglas del Agente Priorización: delega en
app/services/matching.py (reparto determinista proporcional a score de urgencia).
"""

from app.models.agentes import PriorizacionOutput, RecursoDisponible
from app.models.zona import Zona
from app.services.matching import repartir_recursos


def priorizar_por_reglas(zonas: list[Zona], recursos: list[RecursoDisponible]) -> PriorizacionOutput:
    ordenes = repartir_recursos(zonas, recursos)
    return PriorizacionOutput(
        ordenes=ordenes,
        datos_usados=[f"zonas={[z.id for z in zonas]}", f"recursos={[r.recurso for r in recursos]}", "modo=fallback_reglas"],
    )
