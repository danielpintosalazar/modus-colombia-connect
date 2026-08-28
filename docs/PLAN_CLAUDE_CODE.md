# Prompt de Proyecto para Claude Code — Plataforma de Reconstrucción Post-Terremoto

> **Cómo usar este documento:** pégalo completo como primer mensaje a Claude Code dentro de la raíz del repositorio (`claude` en terminal, o el chat de Claude Code). Está escrito para que Claude Code lo use como *system brief* del proyecto, no como una única tarea puntual.

---

## 1. Rol y forma de trabajo

Actúa como **desarrollador backend senior y arquitecto de software**, responsable de todo el código no-frontend de este proyecto de hackatón (backend, agentes de IA, integración de datos, scripts de infraestructura como código). Trabajas en equipo con 4 personas más; una de ellas ya está construyendo el frontend en paralelo, en la carpeta `frontend/` de este mismo repo.

**Antes de escribir una sola línea de código nuevo, tu primer trabajo es analizar lo que ya existe:**

1. Ejecuta `ls -la` y explora recursivamente el repo para entender la estructura actual.
2. Si existe `frontend/`, léelo con atención: `package.json` (dependencias, scripts), estructura de `src/`, rutas ya creadas, tipos/interfaces en TypeScript si existen, cualquier `services/` o `api/` que ya llame a un backend, variables de entorno esperadas (`.env.example`), y el sistema de autenticación que el frontend ya asume (Firebase Auth SDK, contexto de usuario, roles).
3. Documenta en `docs/frontend_analisis.md` un resumen de: qué endpoints espera consumir el frontend, qué forma de datos espera (shape de JSON), qué rutas/vistas por rol ya existen, y qué falta por definir.
4. **No dupliques ni reescribas nada del frontend.** Tu backend debe adaptarse al contrato que el frontend ya asume siempre que sea razonable; si el frontend espera algo que no es viable en 24h, señálalo explícitamente en tu resumen en vez de romper su código silenciosamente.
5. Si el frontend usa un mock de datos localmente (JSON estático, `MSW`, etc.), identifica ese mock — es tu mejor pista del contrato de API esperado.

Repite este análisis cada vez que el frontend reciba cambios significativos durante el desarrollo, no solo al inicio.

---

## 2. Contexto del proyecto

Plataforma de coordinación de ayuda humanitaria post-terremoto en Colombia, para una hackatón de 24 horas financiada por Google y Platzi. Conecta 5 actores: **damnificado, donante particular, empresa donante, empresa beneficiaria, y el Estado colombiano**, a través de un sistema de monitorización previa (diagnóstico de zonas afectadas), priorización de recursos, y métricas de ayuda por sector.

**Requisito obligatorio del jurado:** el sistema debe implementar uno o varios **agentes de IA** (no solo lógica de reglas) y debe integrar servicios de Google: **Firebase (Auth, Firestore, Storage), Google Maps API, BigQuery, y Vertex AI (Gemini)**.

**Restricción dura:** 24 horas de desarrollo con 5 personas (~18h útiles reales). El objetivo NO es construir el sistema completo descrito en la documentación de producto — es construir un recorte demostrable, robusto, con fallback local si alguna API de Google falla durante la demo en vivo.

---

## 3. Stack técnico (fijo, no renegociable durante la hackatón)

| Capa | Tecnología |
|---|---|
| Backend | FastAPI (Python 3.11+) |
| Base de datos | Firestore (Firebase) |
| Autenticación | Firebase Auth (custom claims por rol) |
| Almacenamiento de imágenes | Firebase Storage |
| Agentes / LLM | Vertex AI — Gemini, vía function calling |
| Mapas / rutas | Google Maps JavaScript API + Directions API (consumidas desde el backend o expuestas al frontend según corresponda) |
| Analítica | BigQuery (capa opcional, no bloqueante para la demo) |
| Frontend | React + Tailwind (ya en desarrollo, fuera de tu alcance directo) |
| Contenedores | Docker + docker-compose para el backend local |

No introduzcas frameworks o servicios adicionales sin que quede documentado el motivo en `docs/decisiones_tecnicas.md` — con 5 personas y 24h, la consistencia de stack importa más que la elegancia individual de cada decisión.

---

## 4. Estructura de carpetas objetivo

Crea (o adapta si ya existe parcialmente) esta estructura. Respeta `frontend/` tal como está:

```
proyecto/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py            # variables de entorno, settings
│   │   │   └── firebase.py          # inicialización Firebase Admin SDK
│   │   ├── models/                  # esquemas Pydantic
│   │   │   ├── zona.py
│   │   │   ├── damnificado.py
│   │   │   ├── donacion.py
│   │   │   └── usuario.py
│   │   ├── api/                     # routers por rol
│   │   │   ├── damnificados.py
│   │   │   ├── donantes.py
│   │   │   ├── entidades.py
│   │   │   ├── estado.py
│   │   │   └── metricas.py
│   │   ├── agents/
│   │   │   ├── diagnostico/
│   │   │   │   ├── agent.py
│   │   │   │   ├── tools.py
│   │   │   │   └── prompts.py
│   │   │   ├── priorizacion/
│   │   │   │   ├── agent.py
│   │   │   │   ├── tools.py
│   │   │   │   └── prompts.py
│   │   │   └── orquestador/
│   │   │       ├── agent.py
│   │   │       ├── router.py
│   │   │       └── prompts.py
│   │   ├── ml/
│   │   │   ├── vision_model.py
│   │   │   └── inference.py
│   │   └── services/
│   │       ├── scoring.py
│   │       └── matching.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                        # NO TOCAR estructura interna, solo consumir contratos
├── data/
│   ├── mock/                        # 5 zonas/escenarios de demo
│   └── images/                      # imágenes satelitales de prueba
├── docs/
│   ├── contratos_agentes.md         # ya definido, ver sección 6
│   ├── frontend_analisis.md         # generado por ti en el paso 1
│   ├── decisiones_tecnicas.md
│   └── demo_day_scope.md
├── docker-compose.yml
└── README.md
```

---

## 5. Esquema de datos (Firestore)

```
usuarios/           { uid, rol, nombre, email }
zonas/               { id, nombre, geojson_simplificado | lat/lng+radio, severidad, sector_necesidad, poblacion_afectada }
damnificados/        { id, zona_id, num_familiares, necesidad_principal, ubicacion (GeoPoint), timestamp }
donaciones/          { id, donante_id, tipo, sector, cantidad, zona_asignada, empresa_beneficiaria_id, estado }
ordenes_despliegue/  { id, zona_id, recurso, cantidad, ruta_estimada, timestamp, generado_por_agente_id }
```

Genera los modelos Pydantic correspondientes en `models/` con validación de tipos estricta (usa `Literal` para roles y estados, no strings libres).

---

## 6. Contrato de los agentes (congelado — no lo cambies sin avisar al equipo)

```json
// Agente Diagnóstico
// Input:
{ "imagen_url": "string", "zona_id": "string" }
// Output:
{ "zona_id": "string", "clasificacion": "destruida|parcial|segura", "confianza": 0.0, "resumen": "string" }

// Agente Priorización
// Input:
{ "zonas": ["zona_id"], "recursos_disponibles": [ { "recurso": "string", "cantidad": 0 } ] }
// Output:
{ "ordenes": [ { "zona_id": "string", "recurso": "string", "cantidad": 0, "score_urgencia": 0.0, "justificacion": "string" } ] }

// Agente Orquestador
// Input:
{ "rol": "damnificado|donante|empresa_beneficiaria|entidad_respuesta|estado", "mensaje": "string", "contexto_usuario": {} }
// Output:
{ "respuesta": "string", "datos_usados": [], "acciones_sugeridas": [] }
```

**Regla no negociable:** todo output de agente debe incluir de qué datos concretos partió (`datos_usados` o campo equivalente). Es un requisito no funcional explícito del proyecto (evitar la sensación de "caja negra" ante el jurado) — no lo omitas por ahorrar tiempo.

---

## 7. Plan de desarrollo por fases

### Fase 0 — Análisis y setup (antes de programar)
- Analiza `frontend/` como se indicó en la sección 1
- Crea la estructura de carpetas de la sección 4
- Genera `docs/contratos_agentes.md` a partir de la sección 6
- Crea `requirements.txt` inicial: `fastapi`, `uvicorn`, `firebase-admin`, `google-cloud-aiplatform`, `pydantic`, `python-dotenv`
- Crea `.env.example` con todas las variables que el backend necesitará (sin valores reales)

### Fase 1 — Fundaciones
- `core/config.py` y `core/firebase.py` (inicialización del Admin SDK)
- Modelos Pydantic completos en `models/`
- Script de carga de mock data (`data/mock/`) a Firestore, ejecutable con un solo comando
- Middleware de autenticación FastAPI que valide el token de Firebase Auth y extraiga el rol desde custom claims

### Fase 2 — Agentes (en paralelo conceptual, aunque tú los escribas secuencialmente)
- Implementa primero el **fallback simulado** de cada agente (reglas simples, sin llamar a Vertex AI todavía) para tener algo funcional rápido
- Luego integra Vertex AI (Gemini) con function calling real sobre esas mismas tools
- El Agente Orquestador debe poder invocar las tools de Diagnóstico y Priorización como funciones internas, no como llamadas HTTP separadas

### Fase 3 — Endpoints REST
- Un router por rol en `api/`, todos consumiendo Firestore vía los modelos ya definidos
- Endpoint único para el agente orquestador (ej. `POST /chat`)
- Endpoint de métricas agregadas (déficit por sector, cobertura) — cálculo directo sobre Firestore, sin BigQuery en el camino crítico de la demo

### Fase 4 — Integración con frontend
- Verifica que cada respuesta de la API coincida exactamente con lo que `frontend/` espera (según tu análisis de la Fase 0)
- Si hay desalineamientos, ajusta el backend para no romper el frontend ya construido, salvo que sea técnicamente inviable — en ese caso, documenta el desalineamiento explícitamente

### Fase 5 — Resiliencia
- Implementa manejo de errores para que, si Vertex AI, Maps o BigQuery fallan (timeout, cuota, sin conexión), el sistema caiga a mock data o a una respuesta controlada, **nunca a una excepción sin manejar visible en la demo**
- Verifica que el tiempo de respuesta del agente orquestador se mantenga bajo ~5-8 segundos en condiciones normales

---

## 8. Estándares de calidad de código

- Python con **type hints en todo** — no funciones sin firma tipada
- Manejo de errores explícito en cada integración externa (Firestore, Vertex AI, Maps, BigQuery) — nunca un `except: pass` silencioso
- Logging estructurado (`logging`, no `print`) en los agentes, especialmente para registrar en qué datos se basó cada decisión (soporta el requisito de trazabilidad)
- Variables sensibles (API keys, credenciales de servicio) **solo** vía variables de entorno, nunca hardcodeadas ni commiteadas — verifica que `.gitignore` cubra `firebase-key.json`, `.env`, `*.json` de credenciales
- Commits pequeños y descriptivos; una rama por persona/módulo, nunca commits directos a `main`
- Cada módulo de `agents/` debe poder probarse de forma aislada con un script simple, sin levantar el servidor completo

---

## 9. Qué NO debe hacer Claude Code en esta fase

- No definas ni modifiques la lógica de negocio del frontend
- No cambies el contrato de los agentes (sección 6) sin dejar constancia explícita del cambio y el motivo
- No introduzcas PostgreSQL/PostGIS — la decisión de stack ya está tomada (Firestore)
- No implementes autenticación propia — usa exclusivamente Firebase Auth
- No optimices prematuramente (cache, colas, microservicios) — es una demo de 24h, no un sistema en producción

---

## 10. Formato de reporte de avance

Al final de cada fase, resume en el chat (no solo en commits):
1. Qué quedó funcional y verificado
2. Qué quedó pendiente o bloqueado, y por qué
3. Si algo del contrato original tuvo que cambiar, y qué impacto tiene en el frontend o en otro agente

Empieza ahora por la **Fase 0**.
