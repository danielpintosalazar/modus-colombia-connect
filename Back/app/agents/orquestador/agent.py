"""Agente Orquestador: punto de entrada conversacional único (POST /chat).

Invoca las tools de Diagnóstico y Priorización como funciones internas de
Python (nunca HTTP) usando function calling nativo de Gemini. Si Vertex AI no
está disponible o la llamada falla, cae al enrutador por reglas de router.py.
"""

import json
import logging
import re

from app.agents.diagnostico.agent import diagnosticar
from app.agents.orquestador.prompts import build_orquestador_prompt
from app.agents.orquestador.router import enrutar_por_reglas
from app.agents.priorizacion.agent import priorizar
from app.core.config import get_settings
from app.core.timeouts import LlamadaExternaTimeoutError, run_with_timeout
from app.core.vertex import VertexNotConfiguredError, ensure_vertex_init
from app.models.agentes import (
    DiagnosticoInput,
    OrquestadorInput,
    OrquestadorOutput,
    PriorizacionInput,
    RecursoDisponible,
)

logger = logging.getLogger(__name__)


def _tool_diagnosticar_zona(imagen_url: str, zona_id: str) -> dict:
    return diagnosticar(DiagnosticoInput(imagen_url=imagen_url, zona_id=zona_id)).model_dump(mode="json")


def _tool_priorizar_recursos(zonas: list[str], recursos_disponibles: list[dict]) -> dict:
    entrada = PriorizacionInput(zonas=zonas, recursos_disponibles=[RecursoDisponible(**r) for r in recursos_disponibles])
    return priorizar(entrada).model_dump(mode="json")


_TOOL_IMPLS = {
    "diagnosticar_zona": _tool_diagnosticar_zona,
    "priorizar_recursos": _tool_priorizar_recursos,
}


def _a_nativo(valor):
    """Convierte los args de function_call (proto MapComposite/RepeatedComposite
    anidados) a dict/list nativos de Python para poder pasarlos a los modelos Pydantic."""
    if hasattr(valor, "items"):
        return {k: _a_nativo(v) for k, v in valor.items()}
    if isinstance(valor, str | bytes):
        return valor
    if hasattr(valor, "__iter__"):
        return [_a_nativo(v) for v in valor]
    return valor


def _build_gemini_tool():
    from vertexai.generative_models import FunctionDeclaration, Tool

    return Tool(function_declarations=[
        FunctionDeclaration(
            name="diagnosticar_zona",
            description="Clasifica el estado (destruida/parcial/segura) de una zona a partir de una imagen.",
            parameters={
                "type": "object",
                "properties": {
                    "imagen_url": {"type": "string"},
                    "zona_id": {"type": "string"},
                },
                "required": ["imagen_url", "zona_id"],
            },
        ),
        FunctionDeclaration(
            name="priorizar_recursos",
            description="Reparte recursos disponibles entre zonas según urgencia.",
            parameters={
                "type": "object",
                "properties": {
                    "zonas": {"type": "array", "items": {"type": "string"}},
                    "recursos_disponibles": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {"recurso": {"type": "string"}, "cantidad": {"type": "number"}},
                            "required": ["recurso", "cantidad"],
                        },
                    },
                },
                "required": ["zonas", "recursos_disponibles"],
            },
        ),
    ])


_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def _extraer_json_dict(texto: str) -> dict:
    """Gemini a veces envuelve el JSON en fences markdown o añade prosa. Se extrae
    el primer objeto JSON válido; si no hay ninguno, se lanza para caer al fallback."""
    texto = (texto or "").strip()
    if not texto:
        raise ValueError("respuesta vacía de Gemini")
    for candidato in (texto, *(_FENCE_RE.findall(texto))):
        candidato = candidato.strip()
        try:
            return json.loads(candidato)
        except json.JSONDecodeError:
            pass
    inicio = texto.find("{")
    fin = texto.rfind("}")
    if inicio != -1 and fin > inicio:
        return json.loads(texto[inicio : fin + 1])
    raise ValueError("no se encontró JSON en la respuesta de Gemini")


def _texto_seguro(response) -> str:
    try:
        return response.text or ""
    except Exception:  # noqa: BLE001 — .text lanza si la última parte no es texto
        return ""


def _orquestar_con_gemini(entrada: OrquestadorInput) -> OrquestadorOutput:
    settings = get_settings()
    if settings.agents_force_fallback:
        raise VertexNotConfiguredError("AGENTS_FORCE_FALLBACK=true — se omite Vertex AI intencionalmente.")

    ensure_vertex_init()

    from vertexai.generative_models import GenerativeModel, Part

    model = GenerativeModel(settings.vertex_ai_gemini_model, tools=[_build_gemini_tool()])
    chat = model.start_chat()
    prompt = build_orquestador_prompt(entrada.rol, entrada.mensaje, entrada.contexto_usuario)
    response = chat.send_message(prompt)

    datos_usados: list[str] = ["modo=vertex_ai_gemini"]
    for _ in range(3):  # límite de saltos function-calling → respuesta final, evita loops
        parte = response.candidates[0].content.parts[0]
        function_call = getattr(parte, "function_call", None)
        if not function_call or not function_call.name:
            break

        nombre = function_call.name
        args = _a_nativo(function_call.args)
        datos_usados.append(f"tool={nombre}({args})")
        resultado = _TOOL_IMPLS[nombre](**args)
        response = chat.send_message(
            Part.from_function_response(name=nombre, response={"content": resultado})
        )

    data = _extraer_json_dict(_texto_seguro(response))
    salida = OrquestadorOutput(**data)
    salida.datos_usados = [*salida.datos_usados, *datos_usados]
    return salida


def orquestar(entrada: OrquestadorInput) -> OrquestadorOutput:
    try:
        return run_with_timeout(lambda: _orquestar_con_gemini(entrada), nombre="orquestador.gemini")
    except VertexNotConfiguredError as exc:
        logger.warning("Orquestador: usando fallback por reglas (%s)", exc)
    except LlamadaExternaTimeoutError as exc:
        logger.warning("Orquestador: timeout con Gemini, usando fallback por reglas (%s)", exc)
    except Exception:
        logger.exception("Orquestador: fallo inesperado con Gemini, usando fallback por reglas")

    return enrutar_por_reglas(entrada)
