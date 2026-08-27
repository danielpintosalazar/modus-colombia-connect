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
  "rol": "damnificado|donante|empresa_beneficiaria|entidad_respuesta|estado",
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

_(ninguno todavía)_
