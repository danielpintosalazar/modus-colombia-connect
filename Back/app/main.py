import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import chat, damnificados, donantes, entidades, estado, metricas, zonas
from app.core.config import get_settings
from app.core.firebase import FirebaseNotConfiguredError

settings = get_settings()

logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Modus — Plataforma de Reconstrucción Post-Terremoto", version="0.1.0")

# CORS abierto para la demo (frontend en dev, origen y puerto pueden variar entre máquinas del equipo).
# No es una configuración de producción — ver docs/demo_day_scope.md.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(FirebaseNotConfiguredError)
async def firebase_no_configurado_handler(_: Request, exc: FirebaseNotConfiguredError) -> JSONResponse:
    logger.error("Firebase no configurado: %s", exc)
    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def excepcion_no_manejada_handler(_: Request, exc: Exception) -> JSONResponse:
    # Nunca dejar una excepción sin manejar visible en la demo (PLAN_CLAUDE_CODE.md sección 8).
    logger.exception("Excepción no manejada")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno. El equipo ya fue notificado en los logs."},
    )


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "environment": settings.environment}


app.include_router(zonas.router)
app.include_router(damnificados.router)
app.include_router(donantes.router)
app.include_router(entidades.router)
app.include_router(estado.router)
app.include_router(metricas.router)
app.include_router(chat.router)
