"""Helper de resiliencia: acota a un tiempo máximo cualquier llamada externa
(Vertex AI, Maps, BigQuery) para que un servicio de Google lento nunca cuelgue
la demo. Ver PLAN_CLAUDE_CODE.md sección 7 Fase 5 (~5-8s por respuesta) y
EXTERNAL_CALL_TIMEOUT_SECONDS en .env.example.
"""

import logging
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from typing import TypeVar

from app.core.config import get_settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


class LlamadaExternaTimeoutError(RuntimeError):
    """Una llamada externa superó EXTERNAL_CALL_TIMEOUT_SECONDS."""


def run_with_timeout(fn: Callable[[], T], *, nombre: str) -> T:
    timeout = get_settings().external_call_timeout_seconds
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(fn)
        try:
            return future.result(timeout=timeout)
        except FutureTimeoutError as exc:
            logger.error("Llamada externa '%s' superó el timeout de %ss", nombre, timeout)
            raise LlamadaExternaTimeoutError(f"'{nombre}' superó el timeout de {timeout}s") from exc
