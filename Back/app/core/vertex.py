"""Inicialización perezosa de Vertex AI (Gemini), compartida por los 3 agentes.

Igual que app/core/firebase.py: no falla al importar sin credenciales. Cada
agente decide qué hacer si generate() lanza VertexNotConfiguredError (típicamente,
caer al fallback simulado — ver docs/decisiones_tecnicas.md).
"""

import logging

from app.core.config import get_settings
from app.core.timeouts import LlamadaExternaTimeoutError, run_with_timeout

logger = logging.getLogger(__name__)

_initialized = False


class VertexNotConfiguredError(RuntimeError):
    """Vertex AI no pudo inicializarse o la generación falló (timeout, cuota, credenciales)."""


def ensure_vertex_init() -> None:
    """Inicializa el SDK de Vertex AI una sola vez. Lanza VertexNotConfiguredError si faltan credenciales."""
    global _initialized
    if _initialized:
        return

    settings = get_settings()
    if not settings.has_google_credentials:
        raise VertexNotConfiguredError("GOOGLE_CLOUD_PROJECT no configurado — Vertex AI no disponible.")

    import os
    from pathlib import Path
    import vertexai

    key_path = Path(settings.google_application_credentials)
    if not key_path.is_absolute():
        base_backend = Path(__file__).resolve().parents[2]
        if (base_backend / key_path).exists():
            key_path = base_backend / key_path

    if key_path.exists() and "GOOGLE_APPLICATION_CREDENTIALS" not in os.environ:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(key_path)

    vertexai.init(project=settings.google_cloud_project, location=settings.vertex_ai_region)
    _initialized = True


def generate_json(prompt: str, *, tools: list | None = None) -> str:
    """Llama a Gemini con el prompt dado y devuelve el texto crudo de la respuesta.

    Lanza VertexNotConfiguredError si no hay credenciales o si la llamada falla
    (timeout, cuota, error de red) — el llamador debe capturarla y usar fallback.
    """
    settings = get_settings()
    if settings.agents_force_fallback:
        raise VertexNotConfiguredError("AGENTS_FORCE_FALLBACK=true — se omite Vertex AI intencionalmente.")

    try:
        ensure_vertex_init()

        from vertexai.generative_models import GenerativeModel

        model = GenerativeModel(settings.vertex_ai_gemini_model)

        def _llamar() -> str:
            response = model.generate_content(
                prompt,
                tools=tools,
                generation_config={"temperature": 0.2, "response_mime_type": "application/json"},
            )
            return response.text

        return run_with_timeout(_llamar, nombre="vertex_ai.generate_content")
    except VertexNotConfiguredError:
        raise
    except LlamadaExternaTimeoutError as exc:
        raise VertexNotConfiguredError(str(exc)) from exc
    except Exception as exc:
        logger.exception("Fallo llamando a Vertex AI (Gemini)")
        raise VertexNotConfiguredError(f"Vertex AI falló: {exc}") from exc
