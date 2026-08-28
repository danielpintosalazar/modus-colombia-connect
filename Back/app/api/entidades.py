"""Endpoints para empresa_beneficiaria y estado_entidad_respuesta: donaciones
asignadas y las dos tools de agentes expuestas como HTTP para uso manual/pruebas
(el Agente Orquestador las invoca como funciones internas, no vía este router)."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.agents.diagnostico.agent import diagnosticar
from app.agents.priorizacion.agent import priorizar
from app.core.auth import require_role
from app.core.firebase import FirebaseNotConfiguredError
from app.models.agentes import DiagnosticoInput, DiagnosticoOutput, PriorizacionInput, PriorizacionOutput
from app.models.donacion import Donacion
from app.models.usuario import Usuario
from app.services.repositorio import listar_donaciones

logger = logging.getLogger(__name__)
router = APIRouter(tags=["entidades"])


@router.get("/donaciones/asignadas", response_model=list[Donacion])
def donaciones_asignadas(usuario: Usuario = Depends(require_role("empresa_beneficiaria"))) -> list[Donacion]:
    try:
        todas = listar_donaciones()
    except FirebaseNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    return [d for d in todas if d.empresa_beneficiaria_id == usuario.uid]


@router.post("/agentes/diagnostico", response_model=DiagnosticoOutput)
def agente_diagnostico(
    entrada: DiagnosticoInput,
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> DiagnosticoOutput:
    return diagnosticar(entrada)


@router.post("/agentes/priorizacion", response_model=PriorizacionOutput)
def agente_priorizacion(
    entrada: PriorizacionInput,
    _: Usuario = Depends(require_role("estado_entidad_respuesta")),
) -> PriorizacionOutput:
    return priorizar(entrada)
