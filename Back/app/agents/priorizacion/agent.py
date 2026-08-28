import json
import logging

from app.agents.priorizacion.prompts import build_priorizacion_prompt
from app.agents.priorizacion.tools import priorizar_por_reglas
from app.core.firebase import FirebaseNotConfiguredError
from app.core.vertex import VertexNotConfiguredError, generate_json
from app.models.agentes import PriorizacionInput, PriorizacionOutput
from app.services.repositorio import listar_zonas

logger = logging.getLogger(__name__)


def priorizar(entrada: PriorizacionInput) -> PriorizacionOutput:
    try:
        zonas = listar_zonas(entrada.zonas)
    except FirebaseNotConfiguredError as exc:
        logger.error("Priorización: no se pudo leer Firestore (%s)", exc)
        return PriorizacionOutput(ordenes=[], datos_usados=[f"error={exc}"])

    if not zonas:
        return PriorizacionOutput(ordenes=[], datos_usados=[f"zonas_no_encontradas={entrada.zonas}"])

    try:
        zonas_contexto = json.dumps([z.model_dump(mode="json") for z in zonas], ensure_ascii=False)
        recursos_contexto = json.dumps([r.model_dump() for r in entrada.recursos_disponibles], ensure_ascii=False)
        raw = generate_json(build_priorizacion_prompt(zonas_contexto, recursos_contexto))
        data = json.loads(raw)
        salida = PriorizacionOutput(**data)
        salida.datos_usados = [f"zonas={[z.id for z in zonas]}", "modo=vertex_ai_gemini"]
        return salida
    except VertexNotConfiguredError as exc:
        logger.warning("Priorización: usando fallback simulado (%s)", exc)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        logger.warning("Priorización: respuesta de Gemini inválida, usando fallback (%s)", exc)

    return priorizar_por_reglas(zonas, entrada.recursos_disponibles)
