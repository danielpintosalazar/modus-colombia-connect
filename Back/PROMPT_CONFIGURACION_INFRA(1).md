# Prompt de Configuración de Infraestructura — Firebase / Google Cloud

> Este documento tiene dos partes: **(A)** una checklist de pasos que **tú** (humano) debes hacer manualmente antes, porque ningún agente puede hacerlos por límites de seguridad/facturación/OAuth interactivo, y **(B)** el prompt que le das a Claude Code una vez completada la parte A, para que configure el resto usando el MCP oficial de Firebase y comandos de `gcloud`.

---

## Parte A — Lo que debes hacer tú, manualmente, antes de invocar a Claude Code

Ningún agente de IA (incluyendo Claude Code) puede completar estos pasos de forma autónoma, porque requieren autenticación interactiva en el navegador, datos de facturación, o una decisión humana de seguridad. Hazlos en este orden:

### 1. Cuenta y facturación de Google Cloud
- Crea o confirma que tienes una cuenta de Google Cloud con **facturación habilitada** (Vertex AI, Maps y BigQuery no funcionan en el tier completamente gratuito sin una cuenta de facturación asociada, aunque uses créditos de la hackatón).
- Si Google/Platzi les dieron créditos o un proyecto ya provisionado para la hackatón, confirma con el equipo organizador cuál es el **Project ID** exacto — no crees uno nuevo si ya existe uno asignado.

### 2. Instalar herramientas locales
En tu máquina (no en un entorno sandboxeado sin red):
```bash
# Node.js 18+ y npm (verifica con node --version)
# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### 3. Autenticación interactiva (obligatoriamente manual)
```bash
gcloud auth login
gcloud auth application-default login
firebase login
```
Ambos comandos abren el navegador para que inicies sesión con la cuenta de Google del equipo/hackatón. **Esto no se puede delegar a un agente** — es, intencionalmente, un paso que requiere tu consentimiento humano directo.

### 4. Decisión de seguridad: restricción de API keys
Cuando generes la API key de **Google Maps**, hazlo tú desde la consola (`APIs & Services > Credentials`) y **restríngela manualmente** por dominio/IP antes de compartirla con el equipo. No dejes que un agente genere y distribuya una key sin restricciones — es la forma más común de fuga de cuota/costos en hackatones.

### 5. Aceptar términos de servicio de APIs nuevas
Algunas APIs (Vertex AI la primera vez, BigQuery en un proyecto nuevo) piden aceptar términos de servicio específicos la primera vez que se habilitan desde la consola web. Si `gcloud services enable` falla pidiendo aceptación de términos, entra una vez a la consola, acéptalos, y ya el CLI podrá encargarse de las siguientes activaciones.

### 6. Distribución de credenciales al equipo
Comparte `firebase-key.json` y las variables de `.env` por un canal seguro (gestor de secretos, o al menos un mensaje efímero) — nunca por commit a git ni por canales públicos del equipo. Verifica que `.gitignore` ya excluya estos archivos antes de que nadie haga el primer commit.

---

## Parte B — Prompt para Claude Code (una vez completada la Parte A)

Copia y pega esto en Claude Code, en la raíz del repo, **después** de haber hecho `gcloud auth login` y `firebase login` manualmente:

---

### Prompt

Actúa como ingeniero de DevOps/infraestructura senior. Tu tarea es dejar configurada toda la infraestructura de Google (Firebase + GCP) para este proyecto, usando el servidor MCP oficial de Firebase y comandos `gcloud`/`firebase` vía terminal. Ya completé manualmente el login interactivo (`gcloud auth login`, `gcloud auth application-default login`, `firebase login`), así que tienes sesión activa disponible.

**Paso 1 — Registra el servidor MCP oficial de Firebase** (si no está registrado ya):
```bash
claude mcp add-json firebase '{"command":"npx","args":["-y","firebase-tools@latest","mcp"]}'
```
Verifica que quedó activo con `claude mcp list` y `/mcp` dentro de la sesión. Este servidor reutiliza mi sesión de `firebase login`, no necesita una API key separada.

**Paso 2 — Usa las tools del MCP de Firebase para:**
1. Confirmar el proyecto de Firebase/GCP correcto (listar proyectos existentes; si el equipo ya tiene uno asignado para la hackatón, úsalo — no crees uno nuevo salvo que yo confirme que no existe ninguno).
2. Inicializar Firestore en modo nativo, en la región más cercana a Colombia disponible (`southamerica-east1` u otra que muestres como opción).
3. Habilitar Firebase Authentication con proveedor de email/password (y anónimo si lo consideras útil para la demo).
4. Habilitar Firebase Storage.
5. Crear 5 usuarios de prueba en Firebase Auth, uno por rol (`damnificado`, `donante`, `empresa_beneficiaria`, `entidad_respuesta`, `estado`), y asignar el rol como *custom claim* a cada uno.
6. Validar las reglas de seguridad (`firestore.rules`, `storage.rules`) que yo te indique o que generes tú mismo siguiendo el esquema de datos de `docs/contratos_agentes.md` y el modelo de roles del proyecto.
7. Generar/descargar la configuración del SDK cliente que el frontend necesita (`firebaseConfig`), y colocarla donde el equipo de frontend la espera (revisa `frontend/` primero).

**Paso 3 — Habilita las APIs de GCP necesarias vía `gcloud`** (ejecuta esto tú mismo en terminal, ya tienes sesión activa):
```bash
gcloud config set project TU_PROJECT_ID
gcloud services enable \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  bigquery.googleapis.com \
  maps-backend.googleapis.com
```
Si algún comando falla pidiendo aceptar términos de servicio en la consola web, dime exactamente cuál y yo lo acepto manualmente — no intentes evadir ese paso.

**Paso 4 — Cuenta de servicio para el backend (FastAPI)**
```bash
gcloud iam service-accounts create firebase-adminsdk-hackaton \
  --display-name "Firebase Admin SDK Hackaton"

gcloud iam service-accounts keys create backend/firebase-key.json \
  --iam-account=firebase-adminsdk-hackaton@TU_PROJECT_ID.iam.gserviceaccount.com
```
Confirma que `backend/firebase-key.json` queda excluido en `.gitignore` **antes** de generar el archivo, no después.

**Paso 5 — BigQuery**
El servidor MCP remoto de BigQuery de Google se activa automáticamente al habilitar `bigquery.googleapis.com` en el proyecto (no requiere instalación local separada). Verifica el estado con:
```bash
bq ls --project_id=TU_PROJECT_ID
```
Crea un dataset base (`bq mk --dataset TU_PROJECT_ID:metricas_desastre`) donde luego cargaremos datos agregados para el panel de métricas del Estado. Esto es una capa opcional para la demo — no bloquees el resto del trabajo si algo aquí falla.

**Paso 6 — Vertex AI (Gemini) para los agentes**
Verifica acceso al modelo con:
```bash
gcloud ai models list --region=us-central1 2>/dev/null || echo "revisar región disponible"
```
Documenta en `backend/.env.example` las variables que el código Python necesitará (`GOOGLE_CLOUD_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS`, `VERTEX_AI_REGION`, etc.) — no pongas valores reales en `.env.example`, solo los nombres de las variables.

**Paso 7 — Reporta**
Al terminar, resume: qué quedó habilitado y verificado, qué requirió mi intervención manual (términos de servicio, confirmaciones), y qué API key o credencial genereste que yo deba restringir/revisar manualmente antes de compartirla con el equipo (especialmente la de Maps).

---

## Nota sobre Google Maps API específicamente

A la fecha de esta hackatón, Google también ofrece servidores MCP propios para Maps (anunciados en diciembre de 2025, con capacidades de *grounding* geoespacial). Si tu versión de Claude Code lo tiene disponible en el directorio de conectores, puedes usarlo para consultas y pruebas — pero **la creación y restricción de la API key sigue siendo un paso manual tuyo** (Parte A, punto 4), porque es una decisión de seguridad, no una tarea mecánica delegable.

---

## Resumen: qué es automatizable y qué no

| Tarea | ¿Quién la hace? |
|---|---|
| Login interactivo (`gcloud auth login`, `firebase login`) | **Tú, manual** |
| Habilitar facturación en el proyecto GCP | **Tú, manual** |
| Aceptar términos de servicio de una API nueva por primera vez | **Tú, manual** (si el CLI lo pide) |
| Generar y restringir la API key de Google Maps | **Tú, manual** (restricción es decisión de seguridad) |
| Distribuir credenciales al equipo | **Tú, manual** (canal seguro) |
| Crear/configurar Firestore, Auth, Storage | Claude Code, vía MCP de Firebase |
| Crear usuarios de prueba y custom claims | Claude Code, vía MCP de Firebase |
| Habilitar APIs de GCP (`gcloud services enable`) | Claude Code, vía terminal (con tu sesión ya autenticada) |
| Crear service account y su key JSON | Claude Code, vía terminal |
| Crear dataset de BigQuery | Claude Code, vía terminal/MCP |
| Escribir y mantener `firestore.rules` / `storage.rules` | Claude Code |
