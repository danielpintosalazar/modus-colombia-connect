"""El orquestador nunca lanza: responde por Gemini si hay credenciales o cae al
enrutador por reglas. En ambos casos deja constancia del modo en datos_usados."""

from app.agents.orquestador.agent import orquestar
from app.models.agentes import OrquestadorInput


def test_orquestador_nunca_lanza_y_registra_modo():
    entrada = OrquestadorInput(rol="donante", mensaje="¿Dónde donar?", contexto_usuario={})
    salida = orquestar(entrada)
    assert salida.respuesta
    assert any("modo=" in d for d in salida.datos_usados)
