# Decisiones técnicas

Stack fijo (no renegociable durante la hackatón, ver sección 3 de `PLAN_CLAUDE_CODE.md`): FastAPI, Firestore, Firebase Auth, Firebase Storage, Vertex AI (Gemini), Google Maps API, BigQuery (opcional), Docker.

Cualquier framework o servicio adicional se documenta aquí con el motivo antes de introducirlo.

## Registro

- **2026-08-27** — Carpeta `Back/` del repo (ya existente) se usa como `backend/` del plan, sin renombrar. `docs/`, `data/` y `docker-compose.yml` viven en la raíz del repo, junto a `Back/` y `frontend/`. Decisión tomada con el usuario al iniciar la Fase 0 para no reestructurar un repo ya en uso.
- **2026-08-27** — Los agentes (`diagnostico`, `priorizacion`, `orquestador`) se implementan con **fallback simulado basado en reglas primero**, y luego se integra Vertex AI (Gemini) por function calling sobre las mismas tools, tal como pide la Fase 2 del plan. El fallback no se elimina: queda como resiliencia (Fase 5) si Vertex AI falla en la demo.
- **2026-08-27** — Autenticación Firebase Admin SDK y llamadas a Vertex AI se escriben contra el SDK real desde el inicio (no solo como TODO), aunque no puedan probarse en esta máquina hasta completar el login manual de `gcloud`/`firebase` (ver `PROMPT_CONFIGURACION_INFRA(1).md`, Parte A — pendiente, no instalado en este entorno). El código falla de forma controlada (excepción capturada → fallback) si las credenciales no están configuradas, nunca con una excepción sin manejar.
- **2026-08-27** — `requirements.txt` usa versiones mínimas (`>=`) en vez de pines exactos: esta máquina tiene Python 3.14 (Fedora 44, sin 3.11 disponible) y pinear versiones exactas de todo el árbol de `google-cloud-aiplatform` hacía que el resolver de pip se colgara por horas intentando satisfacer combinaciones viejas incompatibles con cp314. `Dockerfile` sigue fijado a `python:3.11-slim` (la versión que pide el plan) para que el contenedor de cada miembro del equipo sea reproducible independientemente de qué Python tenga su máquina local.
- **2026-08-27** — Se agregó `pydantic[email]` (trae `email-validator`) a `requirements.txt`: `EmailStr` en `models/usuario.py` lo requiere en tiempo de import, no solo de validación, y faltaba en el `requirements.txt` inicial. Verificado con `python -c "from app.main import app"`, `pytest` (7/7 OK) y un arranque real de `uvicorn` con `/health` en 200 y `/zonas` en 401 sin token.
- **2026-08-27 (Infraestructura Parte B)** — Aprovisionamiento completo de Google Cloud y Firebase en el proyecto `go-fest-506814` (`us-central1`):
  - Creación de Firestore Native DB en `us-central1` y despliegue de `firestore.rules` con Firebase CLI.
  - Creación de bucket de almacenamiento `gs://go-fest-506814-storage`.
  - Service Account `firebase-adminsdk-hackaton@go-fest-506814.iam.gserviceaccount.com` configurada con roles `datastore.user`, `aiplatform.user`, `bigquery.admin`, `storage.admin` y `firebaseauth.admin`.
  - Creación del dataset de analítica `metricas_desastre` en BigQuery (Location: `US`).
  - Sembrado de 21 documentos iniciales de demo en Firestore (`usuarios`, `zonas`, `damnificados`, `donaciones`).
  - Resolución dinámica de credenciales en `app/core/firebase.py` y `app/core/vertex.py` para soportar `Certificate` con `Back/firebase-key.json` y fallback a `ApplicationDefault`.

