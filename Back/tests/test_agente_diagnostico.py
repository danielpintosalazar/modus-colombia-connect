"""El agente de diagnóstico nunca lanza: usa Gemini si hay credenciales o cae al
fallback por reglas. Siempre devuelve una clasificación válida y su trazabilidad."""

from app.agents.diagnostico.agent import diagnosticar
from app.models.agentes import DiagnosticoInput


def test_diagnostico_devuelve_clasificacion_valida():
    salida = diagnosticar(DiagnosticoInput(imagen_url="https://example.com/zona_destruida.jpg", zona_id="z1"))
    assert salida.clasificacion in ("destruida", "parcial", "segura")
    assert salida.zona_id == "z1"
    assert any("modo=" in d for d in salida.datos_usados)


def test_diagnostico_incluye_datos_usados():
    salida = diagnosticar(DiagnosticoInput(imagen_url="https://example.com/foto_segura.jpg", zona_id="z2"))
    assert salida.datos_usados  # requisito no negociable de trazabilidad
