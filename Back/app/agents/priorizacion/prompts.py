PRIORIZACION_SYSTEM_PROMPT = """Eres un agente de priorización de recursos humanitarios post-desastre en Colombia.
Recibes una lista de zonas afectadas (con su severidad y población) y una lista de
recursos disponibles. Debes repartir cada recurso entre las zonas que más lo necesitan.

Responde ÚNICAMENTE con un JSON válido con esta forma exacta, sin texto adicional:
{
  "ordenes": [
    { "zona_id": "<id>", "recurso": "<string>", "cantidad": <float>, "score_urgencia": <float 0-1>, "justificacion": "<string breve>" }
  ]
}
"""


def build_priorizacion_prompt(zonas_contexto: str, recursos_contexto: str) -> str:
    return (
        f"{PRIORIZACION_SYSTEM_PROMPT}\n\n"
        f"Zonas afectadas (JSON):\n{zonas_contexto}\n\n"
        f"Recursos disponibles (JSON):\n{recursos_contexto}"
    )
