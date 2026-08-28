"""Sistema de Identificación: busca desastres/emergencias recientes en Colombia
en fuentes abiertas (noticias) usando **Google Programmable Search** — la misma
API key / motor (cx) que la búsqueda de imágenes (`GOOGLE_SEARCH_API_KEY` +
`GOOGLE_CSE_ID`), pero como búsqueda web en vez de imágenes.

Devuelve `Desastre` SIN persistir — de eso se encarga `app/api/desastres.py`,
que además guarda la hora de la búsqueda y aplica la caché de 12 h."""

import hashlib
import logging
import re

import httpx

from app.core.config import get_settings
from app.core.timeouts import LlamadaExternaTimeoutError, run_with_timeout
from app.models.desastre import Desastre, TipoDesastre
from app.services.busqueda_imagenes import _token_cuenta_servicio  # reutiliza el mint OAuth2

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(8.0)
_HEADERS = {"User-Agent": "ModusColombiaConnect/0.1 (hackaton Google+Platzi; contacto: demo@modus.local)"}

# Consulta por defecto: emergencias en Colombia con impacto en población.
CONSULTA_DEFECTO = (
    "(sismo OR terremoto OR inundación OR deslizamiento OR avalancha OR "
    "incendio OR vendaval OR emergencia) Colombia damnificados"
)

_TIPOS: list[tuple[TipoDesastre, str]] = [
    ("sismo", r"sismo|terremoto|temblor|magnitud|epicentro|réplica"),
    ("inundacion", r"inundaci|creciente|desbord|aguacero|lluvias torrenciales"),
    ("deslizamiento", r"deslizamiento|derrumbe|avalancha|alud|remoci[oó]n en masa"),
    ("incendio", r"incendio|conflagraci|quema forestal"),
    ("vendaval", r"vendaval|vientos fuertes|hurac|tormenta|granizada"),
    ("erupcion", r"volc[aá]n|erupci|ca[ií]da de ceniza"),
]

# Departamentos / ciudades frecuentes para un tag de lugar aproximado.
_LUGARES = re.compile(
    r"\b(Amazonas|Antioquia|Arauca|Atlántico|Bolívar|Boyacá|Caldas|Caquetá|Casanare|Cauca|"
    r"Cesar|Chocó|Córdoba|Cundinamarca|Guainía|Guaviare|Huila|La Guajira|Guajira|Magdalena|"
    r"Meta|Nariño|Norte de Santander|Putumayo|Quindío|Risaralda|Santander|Sucre|Tolima|"
    r"Valle del Cauca|Vaupés|Vichada|Bogotá|Medellín|Cali|Barranquilla|Cartagena|Cúcuta|"
    r"Bucaramanga|Manizales|Pereira|Mocoa|Quibdó)\b",
    re.IGNORECASE,
)


def _clasificar(texto: str) -> TipoDesastre:
    bajo = texto.lower()
    for tipo, patron in _TIPOS:
        if re.search(patron, bajo):
            return tipo
    return "otro"


def _detectar_lugar(texto: str) -> str:
    match = _LUGARES.search(texto or "")
    return match.group(0) if match else ""


def _id_estable(url: str) -> str:
    return "des-" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def _fecha_pagemap(pagemap: dict) -> str | None:
    for clave in ("metatags", "newsarticle", "article"):
        for entrada in pagemap.get(clave, []) or []:
            for campo in ("article:published_time", "datePublished", "og:updated_time", "date"):
                if entrada.get(campo):
                    return str(entrada[campo])
    return None


def _buscar(consulta: str, limite: int, dias: int) -> list[Desastre]:
    s = get_settings()
    if not s.google_cse_id:
        raise ValueError(
            "Falta GOOGLE_CSE_ID: sin motor de búsqueda (cx) no se pueden buscar desastres."
        )

    params: dict[str, str | int] = {
        "cx": s.google_cse_id,
        "q": consulta,
        "num": min(limite, 10),
        "gl": "co",
        "hl": "es",
        "lr": "lang_es",
        "sort": "date",
    }
    if dias > 0:
        params["dateRestrict"] = f"d{dias}"

    headers = dict(_HEADERS)
    if s.google_search_api_key:
        params["key"] = s.google_search_api_key
    elif s.google_search_credentials:
        headers["Authorization"] = f"Bearer {_token_cuenta_servicio(s.google_search_credentials)}"
    else:
        raise ValueError("Falta auth para Google Search: define GOOGLE_SEARCH_API_KEY o GOOGLE_SEARCH_CREDENTIALS")

    with httpx.Client(timeout=_TIMEOUT, headers=headers) as cliente:
        r = cliente.get("https://www.googleapis.com/customsearch/v1", params=params)
        r.raise_for_status()
        data = r.json()

    salida: list[Desastre] = []
    for item in data.get("items", []) or []:
        url = item.get("link", "")
        if not url:
            continue
        titulo = item.get("title", "").strip()
        resumen = item.get("snippet", "").strip()
        pagemap = item.get("pagemap", {}) or {}
        imagen = None
        for entrada in pagemap.get("cse_image", []) or []:
            if entrada.get("src"):
                imagen = entrada["src"]
                break
        salida.append(
            Desastre(
                id=_id_estable(url),
                titulo=titulo,
                descripcion=resumen,
                url=url,
                fuente=item.get("displayLink", ""),
                imagen=imagen,
                lugar=_detectar_lugar(f"{titulo} {resumen}"),
                tipo=_clasificar(f"{titulo} {resumen}"),
                consulta=consulta,
                publicado=_fecha_pagemap(pagemap),
            )
        )
    return salida


def buscar_desastres(
    consulta: str | None = None,
    *,
    limite: int = 10,
    dias: int = 7,
) -> list[Desastre]:
    """Busca desastres recientes. Lanza RuntimeError si la fuente no responde /
    no está configurada (el endpoint cae a caché o a datos de demo)."""
    q = (consulta or "").strip() or CONSULTA_DEFECTO
    try:
        return run_with_timeout(lambda: _buscar(q, limite, dias), nombre="busqueda_desastres.google")
    except LlamadaExternaTimeoutError as exc:
        logger.warning("Búsqueda de desastres agotó el timeout")
        raise RuntimeError(str(exc)) from exc
    except ValueError as exc:
        logger.warning("Búsqueda de desastres sin configurar: %s", exc)
        raise RuntimeError(str(exc)) from exc
    except httpx.HTTPError as exc:
        logger.warning("Búsqueda de desastres falló: %s", exc)
        raise RuntimeError(f"Google Programmable Search no respondió: {exc}") from exc
