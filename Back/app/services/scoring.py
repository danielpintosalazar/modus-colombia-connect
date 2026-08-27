"""Cálculo de score de urgencia por zona, usado como fallback determinista del
Agente Priorización y como referencia para validar la salida de Gemini.
"""

from app.models.zona import Severidad, Zona

_PESO_SEVERIDAD: dict[Severidad, float] = {
    "critica": 1.0,
    "media": 0.6,
    "baja": 0.3,
}

_POBLACION_REFERENCIA = 25_000
"""Población afectada que satura el componente de tamaño del score (zona más grande del mock)."""


def score_urgencia_zona(zona: Zona) -> float:
    """Score en [0, 1]: combina severidad reportada y tamaño de población afectada."""
    componente_severidad = _PESO_SEVERIDAD[zona.severidad]
    componente_poblacion = min(zona.poblacion_afectada / _POBLACION_REFERENCIA, 1.0)
    score = 0.7 * componente_severidad + 0.3 * componente_poblacion
    return round(min(score, 1.0), 3)


def justificacion_urgencia(zona: Zona, score: float) -> str:
    return (
        f"Severidad '{zona.severidad}' y {zona.poblacion_afectada:,} personas afectadas "
        f"en '{zona.nombre}' → score de urgencia {score:.2f}."
    )
