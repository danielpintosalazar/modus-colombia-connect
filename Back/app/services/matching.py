"""Distribución determinista de recursos disponibles entre zonas, usada como
fallback del Agente Priorización cuando Vertex AI no está disponible.
"""

from app.models.agentes import OrdenPriorizada, RecursoDisponible
from app.models.zona import Zona
from app.services.scoring import justificacion_urgencia, score_urgencia_zona


def repartir_recursos(zonas: list[Zona], recursos: list[RecursoDisponible]) -> list[OrdenPriorizada]:
    """Reparte cada recurso disponible proporcionalmente al score de urgencia de
    las zonas que lo necesitan (según `sector_necesidad`), priorizando primero
    las de mayor urgencia si el recurso no alcanza para todas.
    """
    ordenes: list[OrdenPriorizada] = []

    for recurso in recursos:
        zonas_candidatas = [z for z in zonas if _necesita(z, recurso.recurso)] or zonas
        zonas_ordenadas = sorted(zonas_candidatas, key=lambda z: score_urgencia_zona(z), reverse=True)

        pendiente = recurso.cantidad
        peso_total = sum(score_urgencia_zona(z) for z in zonas_ordenadas) or 1.0

        for zona in zonas_ordenadas:
            if pendiente <= 0:
                break
            score = score_urgencia_zona(zona)
            cantidad_asignada = min(pendiente, round(recurso.cantidad * (score / peso_total), 2))
            if cantidad_asignada <= 0:
                continue
            pendiente -= cantidad_asignada
            ordenes.append(
                OrdenPriorizada(
                    zona_id=zona.id,
                    recurso=recurso.recurso,
                    cantidad=cantidad_asignada,
                    score_urgencia=score,
                    justificacion=justificacion_urgencia(zona, score),
                )
            )

    return ordenes


def _necesita(zona: Zona, recurso: str) -> bool:
    recurso_normalizado = recurso.strip().lower()
    return any(recurso_normalizado in sector or sector in recurso_normalizado for sector in zona.sector_necesidad)
