# Infraestructura Google Cloud Platform & Firebase — Modus Connect

> **Proyecto GCP / Firebase:** `go-fest-506814` (Display Name: *go fest*, Project Number: `412582952012`)  
> **Región Principal:** `us-central1`  
> **Facturación:** Activa (GDP Hackathon Credits)  
> **Estado:** 100% Aprovisionado, Verificado y Desplegado

---

## 1. Resumen Ejecutivo de la Infraestructura

El proyecto **Modus** cuenta con una infraestructura completa en Google Cloud Platform y Firebase, configurada para conectar a los 5 actores del sistema humanitario:

| Componente | Servicio GCP / Firebase | Identificador / Recurso | Función en el Sistema |
|---|---|---|---|
| **Base de Datos** | Cloud Firestore | `(default)` en modo Native (`us-central1`) | Base de datos NoSQL en tiempo real para zonas, usuarios, reportes y donaciones. |
| **Seguridad de Datos** | Firebase Security Rules | `Back/firestore.rules` | Reglas de acceso basadas en roles (`RBAC`) desplegadas en la nube. |
| **Almacenamiento** | Cloud Storage for Firebase | `gs://go-fest-506814-storage` | Almacenamiento de imágenes satelitales, fotos con dron y evidencia de campo ($T_0$ vs $T_1$). |
| **Cuenta de Servicio** | Google Cloud IAM | `firebase-adminsdk-hackaton@go-fest-506814...` | Credencial segura con roles mínimos para el backend FastAPI (`Back/firebase-key.json`). |
| **Agentes de IA** | Vertex AI | Gemini 2.0 Flash (`us-central1`) | Diagnóstico visual de daño estructural, priorización de recursos y orquestación multi-actor. |
| **Mapeo y Rutas** | Google Maps Platform | Maps JS API, Directions API, Geocoding | Visualización geoespacial interactiva en modo oscuro/satélite y rutas logísticas de ayuda. |
| **Analítica de Datos** | BigQuery | Dataset `go-fest-506814:metricas_desastre` | Cálculo de déficit humanitario agregado por sector para el panel del Estado. |

---

## 2. Capacidades Habilitadas: ¿Qué es posible ahora vs antes?

| Capacidad | Antes (Solo Mock Local) | Ahora (Con Infraestructura Activa) |
|---|---|---|
| **Persistencia Real** | Ninguna. Los datos se reiniciaban al recargar. | **Firestore en la nube**: Cualquier reporte de damnificado, donación o triage queda guardado y sincronizado en tiempo real. |
| **Integración End-to-End** | Frontend desconectado ("modo mock"). | **Pipeline en vivo**: `Frontend (TanStack) ↔ Backend (FastAPI) ↔ Firestore / Cloud Storage / Maps`. |
| **Control de Acceso (RBAC)** | Simulado en botones de la interfaz. | **Reglas de seguridad y Custom Claims**: Cada rol (`damnificado`, `donante`, `entidad_respuesta`, `estado`) solo puede leer/escribir lo autorizado. |
| **Geolocalización Real** | Ilustración 2D estática. | **Google Maps Platform**: Navegación interactiva, capas satelitales en alta resolución y pines precisos por coordenadas GPS. |
| **Resiliencia de IA** | Si fallaba la nube, la app lanzaba errores 500. | **Tolerancia a fallos**: El backend intenta Gemini 2.0 Flash y, ante problemas de cuota o red, cae automáticamente al motor de reglas deterministas. |

---

## 3. APIs de Google Cloud Habilitadas

```bash
# Verificación de APIs activas en el proyecto go-fest-506814
gcloud services list --enabled --project=go-fest-506814
```

- `aiplatform.googleapis.com` — Vertex AI / Generative AI
- `firestore.googleapis.com` — Cloud Firestore API
- `bigquery.googleapis.com` — BigQuery Analytics API
- `firebasestorage.googleapis.com` / `storage.googleapis.com` — Cloud Storage
- `identitytoolkit.googleapis.com` — Firebase Authentication
- `maps-backend.googleapis.com` — Maps JavaScript API
- `directions-backend.googleapis.com` — Directions API
- `geocoding-backend.googleapis.com` — Geocoding API

---

## 4. Estructura de Datos Sembrada en Firestore

El script `Back/scripts/cargar_mock.py` inicializó 21 documentos en Cloud Firestore:

1. **`usuarios/`** (8 perfiles con credenciales y custom claims):
   - `usr-damnificado-1`: Damnificado Demo (`damnificado.demo@modus.demo`, rol: `damnificado`)
   - `usr-donante-1`: Postobón S.A. (`donante1.demo@modus.demo`, rol: `donante`)
   - `usr-donante-2`: Cementos del Pacífico (`donante2.demo@modus.demo`, rol: `donante`)
   - `usr-donante-3`: Donante Particular Demo (`donante3.demo@modus.demo`, rol: `donante`)
   - `usr-empresa-1`: Cruz Roja Colombiana (`empresa1.demo@modus.demo`, rol: `empresa_beneficiaria`)
   - `usr-empresa-2`: ICBF Regional Guajira (`empresa2.demo@modus.demo`, rol: `empresa_beneficiaria`)
   - `usr-entidad-1`: UNGRD Coordinación Nacional (`entidad1.demo@modus.demo`, rol: `entidad_respuesta`)
   - `usr-estado-1`: Estado Colombiano (`estado1.demo@modus.demo`, rol: `estado`)
2. **`zonas/`** (5 zonas críticas de emergencia en Colombia):
   - `zona-mocoa`: Deslizamiento sector San Miguel (Putumayo) — Severidad Crítica
   - `zona-cundinamarca`: Incendio forestal Cerros Orientales — Severidad Media
   - `zona-choco`: Inundación cuenca río Atrato — Severidad Crítica
   - `zona-guajira`: Sequía y desabastecimiento hídrico — Severidad Baja
   - `zona-santander`: Sismo superficial 5.1 Mw Los Santos — Severidad Media
3. **`damnificados/`** (5 reportes iniciales vinculados a zonas de impacto).
4. **`donaciones/`** (3 donaciones con sector y estado de asignación).

---

## 5. Plan de Contingencia: ¿Qué hacer si expira la facturación?

El sistema cuenta con **3 salvaguardas arquitectónicas** para garantizar que la presentación del Demo Day nunca falle:

### Nivel 1 — Modo Fallback de Agentes (Sin cambios de código)
En `Back/.env`, cambiar:
```ini
AGENTS_FORCE_FALLBACK=true
```
Los agentes responderán mediante sus algoritmos heurísticos deterministas locales (< 50 ms de latencia) cumpliendo el contrato de salida estricto.

### Nivel 2 — Modo Mock en Frontend
En `frontend/.env`:
```ini
VITE_USE_MOCK=true
```
El frontend usará los datos de contingencia de `src/lib/modus-data.ts` si el backend se encuentra apagado.

### Nivel 3 — Emuladores Locales de Firebase
Para levantar Firestore, Auth y Storage en local sin internet ni facturación:
```bash
firebase emulators:start --only firestore,auth,storage
```

---

## 6. Guía de Re-Aprovisionamiento desde Cero

Si en el futuro se desea aprovisionar un proyecto de GCP nuevo:

```bash
# 1. Configurar proyecto y habilitar APIs
gcloud config set project <NUEVO_PROJECT_ID>
gcloud services enable aiplatform.googleapis.com firestore.googleapis.com bigquery.googleapis.com maps-backend.googleapis.com directions-backend.googleapis.com geocoding-backend.googleapis.com identitytoolkit.googleapis.com firebasestorage.googleapis.com

# 2. Crear base de datos Firestore y Storage
gcloud firestore databases create --location=us-central1 --type=firestore-native
gcloud storage buckets create gs://<NUEVO_PROJECT_ID>-storage --location=us-central1

# 3. Crear Service Account y descargar credencial
gcloud iam service-accounts create firebase-adminsdk-hackaton --display-name="Firebase Admin SDK"
gcloud projects add-iam-policy-binding <NUEVO_PROJECT_ID> --member="serviceAccount:firebase-adminsdk-hackaton@<NUEVO_PROJECT_ID>.iam.gserviceaccount.com" --role="roles/datastore.user"
gcloud projects add-iam-policy-binding <NUEVO_PROJECT_ID> --member="serviceAccount:firebase-adminsdk-hackaton@<NUEVO_PROJECT_ID>.iam.gserviceaccount.com" --role="roles/aiplatform.user"
gcloud projects add-iam-policy-binding <NUEVO_PROJECT_ID> --member="serviceAccount:firebase-adminsdk-hackaton@<NUEVO_PROJECT_ID>.iam.gserviceaccount.com" --role="roles/bigquery.admin"
gcloud projects add-iam-policy-binding <NUEVO_PROJECT_ID> --member="serviceAccount:firebase-adminsdk-hackaton@<NUEVO_PROJECT_ID>.iam.gserviceaccount.com" --role="roles/storage.admin"
gcloud iam service-accounts keys create Back/firebase-key.json --iam-account=firebase-adminsdk-hackaton@<NUEVO_PROJECT_ID>.iam.gserviceaccount.com

# 4. Desplegar reglas de Firestore y sembrar datos
firebase deploy --only firestore:rules
cd Back && python -m scripts.cargar_mock
```
