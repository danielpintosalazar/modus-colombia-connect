"""Agente Diagnóstico: clasifica una imagen de zona afectada.

Estrategia (Fase 2 / Fase 5 del plan): intenta Gemini primero; si falla por
cualquier motivo (sin credenciales, timeout, cuota, respuesta inválida), cae al
fallback simulado de tools.py. Nunca propaga una excepción sin manejar.
"""

import json
import logging

from app.agents.diagnostico.prompts import build_diagnostico_prompt
from app.agents.diagnostico.tools import clasificar_por_reglas
from app.core.vertex import VertexNotConfiguredError, generate_json
from app.models.agentes import DiagnosticoInput, DiagnosticoOutput

logger = logging.getLogger(__name__)


def diagnosticar(entrada: DiagnosticoInput) -> DiagnosticoOutput:
    try:
        raw = generate_json(build_diagnostico_prompt(entrada.imagen_url))
        data = json.loads(raw)
        return DiagnosticoOutput(
            zona_id=entrada.zona_id,
            clasificacion=data["clasificacion"],
            confianza=float(data["confianza"]),
            resumen=data["resumen"],
            datos_usados=[
                f"imagen_url={entrada.imagen_url}",
                f"zona_id={entrada.zona_id}",
                "modo=vertex_ai_gemini",
            ],
        )
    except VertexNotConfiguredError as exc:
        logger.warning("Diagnóstico: usando fallback simulado (%s)", exc)
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        logger.warning("Diagnóstico: respuesta de Gemini inválida, usando fallback (%s)", exc)

    return clasificar_por_reglas(entrada.imagen_url, entrada.zona_id)
