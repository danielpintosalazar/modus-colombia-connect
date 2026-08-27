"""Sin GOOGLE_CLOUD_PROJECT configurado en el entorno de test, el agente debe
caer automáticamente al fallback por reglas (nunca lanzar una excepción)."""

from app.agents.diagnostico.agent import diagnosticar
from app.models.agentes import DiagnosticoInput


def test_diagnostico_cae_a_fallback_sin_credenciales():
    salida = diagnosticar(DiagnosticoInput(imagen_url="https://example.com/zona_destruida.jpg", zona_id="z1"))
    assert salida.clasificacion == "destruida"
    assert salida.zona_id == "z1"
    assert "modo=fallback_reglas" in salida.datos_usados


def test_diagnostico_incluye_datos_usados():
    salida = diagnosticar(DiagnosticoInput(imagen_url="https://example.com/foto_segura.jpg", zona_id="z2"))
    assert salida.datos_usados  # requisito no negociable de trazabilidad
