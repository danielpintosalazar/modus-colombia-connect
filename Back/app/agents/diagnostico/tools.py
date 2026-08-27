"""Fallback simulado por reglas del Agente Diagnóstico (sin llamar a Vertex AI).

Determinista a partir del nombre del archivo/URL de la imagen, para que la demo
sea reproducible incluso sin conexión: las imágenes mock en data/images/ se
nombran con el sufijo esperado (_destruida, _parcial, _segura).
"""

from app.models.agentes import DiagnosticoOutput

_PALABRAS_CLAVE: dict[str, str] = {
    "destruida": "destruida",
    "colapso": "destruida",
    "parcial": "parcial",
    "danio": "parcial",
    "segura": "segura",
    "intacta": "segura",
}


def clasificar_por_reglas(imagen_url: str, zona_id: str) -> DiagnosticoOutput:
    url_normalizada = imagen_url.lower()
    clasificacion = next(
        (valor for clave, valor in _PALABRAS_CLAVE.items() if clave in url_normalizada),
        "parcial",  # valor conservador si no hay pista en el nombre del archivo
    )

    return DiagnosticoOutput(
        zona_id=zona_id,
        clasificacion=clasificacion,
        confianza=0.55,  # confianza baja intencional: es un fallback heurístico, no un modelo real
        resumen=(
            f"Clasificación por reglas (fallback, sin Vertex AI): se detectó la palabra clave "
            f"asociada a '{clasificacion}' en la URL de la imagen."
        ),
        datos_usados=[f"imagen_url={imagen_url}", f"zona_id={zona_id}", "modo=fallback_reglas"],
    )
