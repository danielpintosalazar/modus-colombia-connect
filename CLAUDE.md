# AGENTS.md — Reglas y Guía de Desarrollo para Antigravity

Este archivo establece las instrucciones maestras, contexto de arquitectura y reglas de desarrollo para el asistente **Antigravity (Google DeepMind)** en el proyecto **Modus Colombia Connect**.

---

## 1. Contexto del Proyecto

* **Nombre:** Modus — Plataforma de Coordinación de Ayuda Humanitaria Post-Terremoto en Colombia.
* **Evento:** Hackatón Google + Platzi (24 horas).
* **Actores del Sistema (5 Roles):**
  1. `damnificado`: Reporte ultraligero de necesidades y ubicación.
  2. `donante`: Donante particular / sector privado (RSE, catálogo de iniciativas).
  3. `empresa_beneficiaria`: Organizaciones de ayuda y ejecución (Cruz Roja, ICBF).
  4. `entidad_respuesta`: Gestión operativa en campo (UNGRD, Bomberos, Defensa Civil).
  5. `estado`: Mando unificado y analítica nacional.

---

## 2. Stack Tecnológico & Infraestructura Activa

* **Proyecto GCP / Firebase:** `go-fest-506814` (Región: `us-central1`).
* **Backend:** FastAPI (Python 3.11/3.12) en carpeta `Back/`.
* **Frontend:** React 19 + TanStack Start / Router + Tailwind CSS en carpeta `frontend/`.
* **Base de Datos:** Cloud Firestore en modo Nativo con reglas de seguridad desplegadas (`firestore.rules`).
* **Autenticación:** Firebase Auth con Custom Claims de rol + tokens de desarrollo (`dev-token:<rol>`) en local.
* **Almacenamiento:** Cloud Storage (`gs://go-fest-506814-storage`).
* **Agentes / LLM:** Vertex AI (Gemini 2.0 Flash) con fallback determinista basado en reglas (`app/agents/`).
* **Mapas:** Google Maps JavaScript API con visualización geoespacial e interactiva de zonas y rutas.
* **Analítica:** BigQuery (`go-fest-506814:metricas_desastre`).

---

## 3. Reglas Mandatorias de Desarrollo

### 📜 Regla 1 — Documentación Continua de Features
Cada vez que se implemente una nueva característica, endpoint, componente o cambio de contrato:
1. **Actualizar `docs/decisiones_tecnicas.md`** registrando la fecha, el cambio realizado y el motivo técnico.
2. Si afecta contratos o endpoints, actualizar [docs/frontend_analisis.md](docs/frontend_analisis.md) o [docs/contratos_agentes.md](docs/contratos_agentes.md).
3. Si impacta el flujo de prueba local, reflejarlo en [docs/guia_verificacion_local.md](docs/guia_verificacion_local.md).

### 🛡️ Regla 2 — Resiliencia y Fallbacks Siempre Activos
* Nunca eliminar los mecanismos de fallback (`AGENTS_FORCE_FALLBACK`, `VITE_USE_MOCK`, o reglas deterministas locales). La aplicación ante el jurado **nunca debe lanzar errores no manejados o pantallas en blanco** si una API de Google experimenta latencia o falta de cuota.

### 🔒 Regla 3 — Seguridad y Manejo de Secretos
* **Nunca commitear credenciales:** `Back/firebase-key.json`, `.env`, `*.json` de service accounts y claves privadas deben permanecer estrictamente ignoradas en `.gitignore`.
* En frontend solo exponer variables públicas con prefijo `VITE_`.

### 🧩 Regla 4 — Calidad de Código
* **Backend:** Type hints obligatorios en todas las firmas de funciones y modelos Pydantic estrictos. Manejo explícito de excepciones con logging estructurado (`logging`).
* **Frontend:** TypeScript estricto, componentes modulares en `src/components/modus/` y reutilización del design system basado en Tailwind y Shadcn/Radix.

---

## 4. Directorio de Documentación Clave

* [`docs/guia_verificacion_local.md`](docs/guia_verificacion_local.md) — Guía para correr y verificar el stack en local.
* [`docs/infraestructura_gcp_firebase.md`](docs/infraestructura_gcp_firebase.md) — Reporte y arquitectura de infraestructura en la nube y capacidades activas.
* [`docs/contratos_agentes.md`](docs/contratos_agentes.md) — Contratos congelados de entrada/salida de los agentes de IA.
* [`docs/decisiones_tecnicas.md`](docs/decisiones_tecnicas.md) — Bitácora cronológica de arquitectura y stack.
* [`docs/frontend_analisis.md`](docs/frontend_analisis.md) — Análisis de endpoints e integración UI.
* [`docs/demo_day_scope.md`](docs/demo_day_scope.md) — Alcance priorizado para la presentación del Demo Day.
