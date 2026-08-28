"""Endpoint único del Agente Orquestador (PLAN_CLAUDE_CODE.md, sección 7 Fase 3)."""

import logging

from fastapi import APIRouter, Depends

from app.agents.orquestador.agent import orquestar
from app.core.auth import get_current_user
from app.models.agentes import OrquestadorInput, OrquestadorOutput
from app.models.usuario import Usuario

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=OrquestadorOutput)
def chat(entrada: OrquestadorInput, usuario: Usuario = Depends(get_current_user)) -> OrquestadorOutput:
    if entrada.rol != usuario.rol:
        logger.warning("rol del body (%s) no coincide con el rol del token (%s); se usa el del token", entrada.rol, usuario.rol)
        entrada = entrada.model_copy(update={"rol": usuario.rol})
    return orquestar(entrada)
