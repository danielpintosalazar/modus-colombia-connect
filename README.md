# Modus — Plataforma de Reconstrucción Post-Terremoto

Plataforma de coordinación de ayuda humanitaria post-terremoto en Colombia (hackatón Google + Platzi, 24h). Conecta 5 actores — damnificado, donante particular, empresa donante, empresa beneficiaria y el Estado colombiano — mediante monitorización de zonas afectadas, priorización de recursos con agentes de IA, y métricas de ayuda por sector.

## Estructura

```
Back/        # backend FastAPI (Python) — ver Back/requirements.txt
frontend/    # frontend React + TanStack Start (equipo aparte)
data/        # datos mock de demo (5 zonas) e imágenes de prueba
docs/        # contratos de agentes, decisiones técnicas, análisis del frontend
docker-compose.yml
```

## Arranque con Docker (todo el stack)

```bash
docker compose up --build
```

- Frontend → <http://localhost:8080>
- Backend  → <http://localhost:8000> (OpenAPI en `/docs`, health en `/health`)

El frontend (`modus-frontend`, Vite dev + SSR) arranca hablando con el backend
(`VITE_USE_MOCK=false`). El navegador usa `http://localhost:8000`; el render en
servidor usa `http://backend:8000` dentro de la red de compose (`API_URL_INTERNAL`).
Si el backend no responde, el frontend cae solo a los datos mock locales.

El backend (`modus-backend`) corre sin credenciales de Google Cloud: los agentes
usan su fallback por reglas (`AGENTS_FORCE_FALLBACK=true`) y los endpoints de
Firestore devuelven `503`. El portal público sirve las 5 zonas de `data/mock/`.
Para credenciales reales: `cp Back/.env.example Back/.env` y completarlo — compose
lo carga si existe.

> Hosts con SELinux (Fedora/RHEL): los bind mounts llevan `:z`. En Docker Desktop
> (macOS/Windows) es inocuo.

Comandos útiles: `docker compose up -d` (segundo plano) · `docker compose logs -f frontend` · `docker compose down`.

## Backend — arranque rápido (sin Docker)

```bash
cd Back
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # completar con las credenciales reales (no commitear)
uvicorn app.main:app --reload
```

Sin `GOOGLE_CLOUD_PROJECT` configurado, el backend arranca igual: los endpoints que dependen de Firestore devuelven `503`, y los 3 agentes de IA caen automáticamente a su fallback simulado por reglas (ver `docs/decisiones_tecnicas.md`).

### Cargar datos de demo a Firestore

```bash
cd Back
python -m scripts.cargar_mock
```

### Tests

```bash
cd Back
pytest
```

## Documentación del Proyecto

- [`AGENTS.md`](AGENTS.md) — 🤖 **Instrucciones maestras y reglas de desarrollo continuo para Antigravity**.
- [`docs/guia_verificacion_local.md`](docs/guia_verificacion_local.md) — 📖 **Guía interactiva paso a paso para correr y verificar la app en local (Back + Front)**.
- [`docs/infraestructura_gcp_firebase.md`](docs/infraestructura_gcp_firebase.md) — ☁️ **Arquitectura de infraestructura Google Cloud & Firebase (`go-fest-506814`)**.
- [`docs/contratos_agentes.md`](docs/contratos_agentes.md) — 🤖 Contratos congelados de entrada y salida de los 3 agentes de IA.
- [`docs/frontend_analisis.md`](docs/frontend_analisis.md) — 🎨 Análisis de contratos de API e integración con la UI.
- [`docs/decisiones_tecnicas.md`](docs/decisiones_tecnicas.md) — 📋 Bitácora histórica de decisiones técnicas y arquitectura.
- [`docs/demo_day_scope.md`](docs/demo_day_scope.md) — 🎯 Alcance priorizado para la presentación del Demo Day.

## Infraestructura en la Nube (Google Cloud & Firebase)

La infraestructura se encuentra **completamente aprovisionada y operativa** en el proyecto **`go-fest-506814`** (`us-central1`):
- **Cloud Firestore Native**: Base de datos NoSQL activa con 21 documentos iniciales y reglas de seguridad desplegadas (`Back/firestore.rules`).
- **Google Maps Platform**: Integración con Maps JavaScript API en modo oscuro y satelital.
- **Cloud Storage**: Bucket `gs://go-fest-506814-storage` para evidencia visual de desastres.
- **Service Account**: `firebase-adminsdk-hackaton@go-fest-506814...` con credencial en `Back/firebase-key.json`.
- **BigQuery**: Dataset `metricas_desastre` listo para analítica y métricas de ayuda por sector.
- **Vertex AI & Resiliencia**: Modelos Gemini 2.0 Flash con fallback automático determinista ante contingencias de cuota.

