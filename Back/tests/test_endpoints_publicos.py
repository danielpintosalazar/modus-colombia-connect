"""Sin Firestore configurado, los endpoints públicos y con fallback deben
responder 200 con los datos de demo, nunca 5xx. Cubre D3/D4 y métricas."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
AUTH = {"Authorization": "Bearer dev-token:estado_entidad_respuesta"}


def test_iniciativas_publicas_fallback():
    r = client.get("/iniciativas/publicas")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert {"id", "titulo", "zona_id", "sector", "estado"} <= set(data[0])


def test_necesidades_requiere_rol_fusionado():
    assert client.get("/necesidades/").status_code in (401, 403)
    assert client.get("/necesidades/", headers={"Authorization": "Bearer dev-token:donante"}).status_code == 403
    r = client.get("/necesidades/", headers=AUTH)
    assert r.status_code == 200
    assert all(n["fuente"] in ("manual", "agente_diagnostico", "sistema_riesgo") for n in r.json())


def test_necesidades_alias_de_rol_antiguo_sigue_funcionando():
    r = client.get("/necesidades/", headers={"Authorization": "Bearer dev-token:entidad_respuesta"})
    assert r.status_code == 200


def test_auth_me_resuelve_rol_del_dev_token():
    r = client.get("/auth/me", headers=AUTH)
    assert r.status_code == 200
    assert r.json()["rol"] == "estado_entidad_respuesta"
    # alias del rol antiguo
    r2 = client.get("/auth/me", headers={"Authorization": "Bearer dev-token:estado"})
    assert r2.json()["rol"] == "estado_entidad_respuesta"


def test_auth_config_reporta_modo_dev():
    body = client.get("/auth/config").json()
    assert body["acepta_dev_token"] is True


def test_centros_acopio_lectura_publica():
    r = client.get("/centros-acopio/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_avances_y_notificaciones_requieren_rol():
    for path in ("/avances/", "/estado/notificaciones", "/evidencias"):
        assert client.get(path).status_code in (401, 403)
        assert client.get(path, headers={"Authorization": "Bearer dev-token:donante"}).status_code == 403
        assert client.get(path, headers=AUTH).status_code == 200


def test_evidencias_de_zona_lista_para_autenticado():
    r = client.get("/zonas/zona-mocoa/evidencias", headers={"Authorization": "Bearer dev-token:donante"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_desastres_requiere_rol_fusionado():
    assert client.get("/desastres/").status_code in (401, 403)
    assert client.get("/desastres/", headers={"Authorization": "Bearer dev-token:donante"}).status_code == 403


def test_desastres_cae_a_demo_sin_firestore_ni_busqueda(monkeypatch):
    """Sin Firestore y con la búsqueda caída, /desastres responde 200 con datos
    de demo — nunca un 5xx (Regla 2)."""
    import app.api.desastres as d
    from app.core.firebase import FirebaseNotConfiguredError

    def _sin_firestore(*_a, **_k):
        raise FirebaseNotConfiguredError("test")

    def _sin_busqueda(*_a, **_k):
        raise RuntimeError("Google Programmable Search no respondió (test)")

    monkeypatch.setattr(d, "listar_desastres", _sin_firestore)
    monkeypatch.setattr(d, "buscar_desastres", _sin_busqueda)

    r = client.get("/desastres/", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["fuente"] == "demo"
    assert body["total"] >= 1
    assert {"id", "titulo", "tipo", "buscado_en"} <= set(body["desastres"][0])


def test_desastres_usa_cache_si_hay_uno_reciente(monkeypatch):
    """Basta un desastre buscado hace < 12 h para NO llamar a la API."""
    from datetime import datetime, timezone

    import app.api.desastres as d
    from app.models.desastre import Desastre

    reciente = Desastre(
        id="des-test-1",
        titulo="Sismo de prueba",
        tipo="sismo",
        buscado_en=datetime.now(timezone.utc),
    )

    def _boom(*_a, **_k):
        raise AssertionError("no debería buscar: hay caché reciente")

    monkeypatch.setattr(d, "listar_desastres", lambda: [reciente])
    monkeypatch.setattr(d, "buscar_desastres", _boom)

    r = client.get("/desastres/", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["fuente"] == "cache"
    assert body["total"] == 1


def test_metricas_responde_con_datos(monkeypatch):
    # Fuerza el camino de fallback aunque haya credenciales, para probarlo aislado.
    import app.api.metricas as m
    from app.core.firebase import FirebaseNotConfiguredError

    def _boom(*_a, **_k):
        raise FirebaseNotConfiguredError("test")

    monkeypatch.setattr(m, "listar_zonas", _boom)
    r = client.get("/metricas/", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["fuente"] == "demo"
    assert body["poblacion_afectada_total"] > 0
    assert len(body["deficit_por_sector"]) >= 1
