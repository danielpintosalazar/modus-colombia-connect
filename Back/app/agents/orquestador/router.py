"""Fallback simulado por reglas del Agente Orquestador: enrutamiento por
palabras clave a las tools internas de Diagnóstico/Priorización (llamadas
como funciones Python, nunca HTTP — ver PLAN_CLAUDE_CODE.md sección 7 Fase 2),
o a una respuesta canned por rol si no aplica ninguna tool.
"""

from app.agents.diagnostico.agent import diagnosticar
from app.agents.priorizacion.agent import priorizar
from app.models.agentes import (
    DiagnosticoInput,
    OrquestadorInput,
    OrquestadorOutput,
    PriorizacionInput,
    RecursoDisponible,
)

_RESPUESTA_POR_ROL: dict[str, str] = {
    "damnificado": "Puedes reportar tu necesidad principal y ubicación desde la app; las entidades de respuesta la verán priorizada según la urgencia de tu zona.",
    "donante": "Puedes ver el déficit por sector y zona en el panel de métricas para decidir dónde tu donación tiene más impacto.",
    "empresa_beneficiaria": "Revisa tus donaciones asignadas y su estado de entrega en tu panel.",
    "estado_entidad_respuesta": "Consulta el panel consolidado: métricas de cobertura y déficit por sector a nivel nacional, órdenes de despliegue activas y estado de diagnóstico de cada zona.",
}


def enrutar_por_reglas(entrada: OrquestadorInput) -> OrquestadorOutput:
    mensaje = entrada.mensaje.lower()
    ctx = entrada.contexto_usuario

    if "diagnóstico" in mensaje or "diagnostico" in mensaje or "clasifica" in mensaje:
        imagen_url = ctx.get("imagen_url")
        zona_id = ctx.get("zona_id")
        if imagen_url and zona_id:
            resultado = diagnosticar(DiagnosticoInput(imagen_url=imagen_url, zona_id=zona_id))
            return OrquestadorOutput(
                respuesta=f"Diagnóstico de la zona {zona_id}: {resultado.clasificacion} ({resultado.resumen})",
                datos_usados=[*resultado.datos_usados, "tool=diagnosticar_zona", "modo=fallback_reglas"],
                acciones_sugeridas=["Revisar el detalle de la zona en el panel de entidad de respuesta"],
            )

    if "prioriza" in mensaje or "recursos" in mensaje:
        zonas = ctx.get("zonas")
        recursos = ctx.get("recursos_disponibles")
        if zonas and recursos:
            resultado = priorizar(
                PriorizacionInput(zonas=zonas, recursos_disponibles=[RecursoDisponible(**r) for r in recursos])
            )
            resumen = "; ".join(f"{o.recurso}→{o.zona_id} ({o.cantidad})" for o in resultado.ordenes[:5])
            return OrquestadorOutput(
                respuesta=f"Propuesta de priorización: {resumen or 'sin órdenes generadas'}",
                datos_usados=[*resultado.datos_usados, "tool=priorizar_recursos", "modo=fallback_reglas"],
                acciones_sugeridas=["Confirmar o ajustar las órdenes de despliegue propuestas"],
            )

    return OrquestadorOutput(
        respuesta=_RESPUESTA_POR_ROL.get(entrada.rol, "No tengo una respuesta específica para este rol todavía."),
        datos_usados=[f"contexto_usuario={ctx}", "modo=fallback_reglas"],
        acciones_sugeridas=[],
    )
