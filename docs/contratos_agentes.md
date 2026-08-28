# Contrato de agentes — CONGELADO

> Fuente: sección 6 de `PLAN_CLAUDE_CODE.md`. No modificar sin dejar constancia explícita del cambio y el motivo en este mismo archivo (agregar una sección "Cambios" al final).

## Agente Diagnóstico

**Input**
```json
{ "imagen_url": "string", "zona_id": "string" }
```

**Output**
```json
{
  "zona_id": "string",
  "clasificacion": "destruida|parcial|segura",
  "confianza": 0.0,
  "resumen": "string"
}
```

## Agente Priorización

**Input**
```json
{
  "zonas": ["zona_id"],
  "recursos_disponibles": [ { "recurso": "string", "cantidad": 0 } ]
}
```

**Output**
```json
{
  "ordenes": [
    { "zona_id": "string", "recurso": "string", "cantidad": 0, "score_urgencia": 0.0, "justificacion": "string" }
  ]
}
```

## Agente Orquestador

**Input**
```json
{
  "rol": "damnificado|donante|empresa_beneficiaria|estado_entidad_respuesta",
  "mensaje": "string",
  "contexto_usuario": {}
}
```

**Output**
```json
{
  "respuesta": "string",
  "datos_usados": [],
  "acciones_sugeridas": []
}
```

## Regla no negociable

Todo output de agente debe incluir de qué datos concretos partió (`datos_usados` o campo equivalente). Es requisito no funcional explícito del proyecto (trazabilidad ante el jurado, evitar sensación de "caja negra") — no se omite por ahorrar tiempo.

## Cambios

- **2026-08-28 — Decisión D1 (`rectificar verificar.md`).** El enum `rol` del Agente Orquestador pasa de `damnificado|donante|empresa_beneficiaria|entidad_respuesta|estado` a `damnificado|donante|empresa_beneficiaria|estado_entidad_respuesta`. Motivo: para P0 el Estado y la Entidad de Respuesta se fusionan en un único rol con permisos combinados (ahorra un rol de auth y una vista en 24h). El resto del contrato (Input/Output de los 3 agentes, campos, `datos_usados`) no cambia. Separarlos vuelve a `entidad_respuesta` + `estado` como P1 si sobra tiempo.
