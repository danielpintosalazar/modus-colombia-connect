"""Sin credenciales, el orquestador debe caer al enrutador por reglas y nunca lanzar."""

from app.agents.orquestador.agent import orquestar
from app.models.agentes import OrquestadorInput


def test_orquestador_cae_a_fallback_sin_credenciales():
    entrada = OrquestadorInput(rol="donante", mensaje="¿Dónde donar?", contexto_usuario={})
    salida = orquestar(entrada)
    assert salida.respuesta
    assert "modo=fallback_reglas" in salida.datos_usados
