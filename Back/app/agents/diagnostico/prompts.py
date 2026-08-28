DIAGNOSTICO_SYSTEM_PROMPT = """Eres un agente de diagnóstico de daños post-desastre para Colombia.
Recibes la URL de una imagen (satelital o de campo) de una zona afectada y debes clasificar su estado.

Responde ÚNICAMENTE con un JSON válido con esta forma exacta, sin texto adicional:
{
  "clasificacion": "destruida" | "parcial" | "segura",
  "confianza": <float entre 0 y 1>,
  "resumen": "<explicación breve en español, 1-2 frases, mencionando qué evidencia visual sustenta la clasificación>"
}
"""


def build_diagnostico_prompt(imagen_url: str) -> str:
    return f"{DIAGNOSTICO_SYSTEM_PROMPT}\n\nImagen a analizar: {imagen_url}"
