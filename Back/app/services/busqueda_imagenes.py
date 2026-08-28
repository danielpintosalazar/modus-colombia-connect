"""Buscador de imágenes reales para la fase de análisis. Consulta fuentes con
licencia abierta (Wikimedia Commons, Openverse) y, si está configurada,
Google Programmable Search. Devuelve candidatos SIN guardarlos — un humano
elige cuáles registrar como Evidencia."""

import logging

import httpx
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.timeouts import LlamadaExternaTimeoutError, run_with_timeout

logger = logging.getLogger(__name__)

FuenteBusqueda = str  # "wikimedia" | "openverse" | "google"
_TIMEOUT = httpx.Timeout(8.0)
_HEADERS = {"User-Agent": "ModusColombiaConnect/0.1 (hackaton Google+Platzi; contacto: demo@modus.local)"}


class ResultadoBusqueda(BaseModel):
    url: str
    thumbnail: str | None = None
    titulo: str = ""
    fuente: str = ""          # de dónde salió (Wikimedia Commons, Openverse…)
    licencia: str = ""        # p. ej. "CC BY-SA 4.0", "Public domain"
    autor: str = ""
    pagina: str | None = None  # URL de la ficha original (atribución)
    ancho: int | None = None
    alto: int | None = None


def _limpiar_html(texto: str) -> str:
    import re

    return re.sub(r"<[^>]+>", "", texto or "").strip()


def buscar_wikimedia(consulta: str, limite: int) -> list[ResultadoBusqueda]:
    """Imágenes de Wikimedia Commons (todas con licencia libre)."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": consulta,
        "gsrnamespace": "6",  # File:
        "gsrlimit": str(min(limite, 20)),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
        "iiurlwidth": "1024",
    }
    with httpx.Client(timeout=_TIMEOUT, headers=_HEADERS) as cliente:
        r = cliente.get("https://commons.wikimedia.org/w/api.php", params=params)
        r.raise_for_status()
        data = r.json()

    salida: list[ResultadoBusqueda] = []
    for pagina in (data.get("query", {}).get("pages", {}) or {}).values():
        info = (pagina.get("imageinfo") or [{}])[0]
        if not info.get("url") or not str(info.get("mime", "")).startswith("image/"):
            continue
        meta = info.get("extmetadata", {}) or {}
        salida.append(
            ResultadoBusqueda(
                url=info["url"],
                thumbnail=info.get("thumburl") or info["url"],
                titulo=pagina.get("title", "").removeprefix("File:"),
                fuente="Wikimedia Commons",
                licencia=_limpiar_html(meta.get("LicenseShortName", {}).get("value", "")),
                autor=_limpiar_html(meta.get("Artist", {}).get("value", "")),
                pagina=info.get("descriptionurl"),
                ancho=info.get("width"),
                alto=info.get("height"),
            )
        )
    return salida


def buscar_openverse(consulta: str, limite: int) -> list[ResultadoBusqueda]:
    """Openverse: agregador de imágenes con licencia CC / dominio público."""
    with httpx.Client(timeout=_TIMEOUT, headers=_HEADERS) as cliente:
        r = cliente.get(
            "https://api.openverse.org/v1/images/",
            params={"q": consulta, "page_size": min(limite, 20)},
        )
        r.raise_for_status()
        data = r.json()

    salida: list[ResultadoBusqueda] = []
    for item in data.get("results", []) or []:
        if not item.get("url"):
            continue
        salida.append(
            ResultadoBusqueda(
                url=item["url"],
                thumbnail=item.get("thumbnail") or item["url"],
                titulo=item.get("title", ""),
                fuente=f"Openverse · {item.get('source', '')}".strip(" ·"),
                licencia=f"{item.get('license', '')} {item.get('license_version', '')}".strip().upper(),
                autor=item.get("creator", "") or "",
                pagina=item.get("foreign_landing_url"),
                ancho=item.get("width"),
                alto=item.get("height"),
            )
        )
    return salida


def _token_cuenta_servicio(ruta_json: str) -> str:
    """Mint de un access token OAuth2 a partir de una cuenta de servicio."""
    from pathlib import Path

    import google.auth.transport.requests
    from google.oauth2 import service_account

    ruta = Path(ruta_json)
    if not ruta.is_absolute():
        base = Path(__file__).resolve().parents[2]
        if (base / ruta).exists():
            ruta = base / ruta
    creds = service_account.Credentials.from_service_account_file(
        str(ruta), scopes=["https://www.googleapis.com/auth/cse"]
    )
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token


def buscar_google(consulta: str, limite: int) -> list[ResultadoBusqueda]:
    """Google Programmable Search (image search).

    Necesita SIEMPRE `GOOGLE_CSE_ID` (el motor de búsqueda / cx) y, para autenticar,
    O BIEN `GOOGLE_SEARCH_API_KEY` O BIEN `GOOGLE_SEARCH_CREDENTIALS` (cuenta de servicio).
    """
    s = get_settings()
    if not s.google_cse_id:
        raise ValueError(
            "Falta GOOGLE_CSE_ID: crea un motor en https://programmablesearchengine.google.com "
            "(buscar en toda la web + búsqueda de imágenes ON) y copia su 'Search engine ID'."
        )

    params = {
        "cx": s.google_cse_id,
        "q": consulta,
        "searchType": "image",
        "num": min(limite, 10),
        "rights": "cc_publicdomain|cc_attribute|cc_sharealike",
        "imgSize": "large",
    }
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

    salida: list[ResultadoBusqueda] = []
    for item in data.get("items", []) or []:
        img = item.get("image", {})
        salida.append(
            ResultadoBusqueda(
                url=item.get("link", ""),
                thumbnail=img.get("thumbnailLink"),
                titulo=item.get("title", ""),
                fuente=f"Google · {img.get('contextLink', '')}",
                licencia="(revisar en la fuente)",
                pagina=img.get("contextLink"),
                ancho=img.get("width"),
                alto=img.get("height"),
            )
        )
    return salida


_PROVEEDORES = {
    "wikimedia": buscar_wikimedia,
    "openverse": buscar_openverse,
    "google": buscar_google,
}


def buscar_imagenes(consulta: str, *, fuente: FuenteBusqueda = "wikimedia", limite: int = 12) -> list[ResultadoBusqueda]:
    proveedor = _PROVEEDORES.get(fuente)
    if proveedor is None:
        raise ValueError(f"Fuente desconocida: {fuente}. Usa: {', '.join(_PROVEEDORES)}")
    try:
        return run_with_timeout(lambda: proveedor(consulta, limite), nombre=f"busqueda_imagenes.{fuente}")
    except LlamadaExternaTimeoutError as exc:
        logger.warning("Búsqueda de imágenes '%s' agotó el timeout", fuente)
        raise RuntimeError(str(exc)) from exc
    except httpx.HTTPError as exc:
        logger.warning("Búsqueda de imágenes '%s' falló: %s", fuente, exc)
        raise RuntimeError(f"La fuente '{fuente}' no respondió: {exc}") from exc
