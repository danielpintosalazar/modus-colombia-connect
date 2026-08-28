# Reporte de Configuración de Infraestructura — Firebase & Google Cloud

> **Fecha de ejecución:** 27 de Agosto de 2026  
> **Proyecto:** `go-fest-506814` (Nombre: *go fest*, Número: `412582952012`)  
> **Región Principal:** `us-central1`  
> **Facturación:** Activa (`billingAccounts/018128-F27F78-3FBA70`)

---

## 1. Resumen de lo Configurado

Se ha completado la ejecución de la **Parte B** establecida en [PROMPT_CONFIGURACION_INFRA(1).md](PROMPT_CONFIGURACION_INFRA(1).md). La infraestructura en la nube y las credenciales locales para el backend FastAPI y los agentes de IA se encuentran listas y operativas.

| Componente | Recurso / Identificador | Estado |
|---|---|---|
| **Proyecto GCP** | `go-fest-506814` | Activo y configurado como predeterminado en `gcloud` y `.firebaserc` |
| **Firestore DB** | `(default)` en modo Native (`us-central1`) | Creado, tier gratuito activo |
| **Reglas Firestore** | `Back/firestore.rules` | Desplegadas exitosamente en la nube con Firebase CLI |
| **Cloud Storage** | `gs://go-fest-506814-storage` (`us-central1`) | Creado y vinculado a la configuración |
| **Service Account** | `firebase-adminsdk-hackaton@go-fest-506814.iam.gserviceaccount.com` | Creada con roles de Firestore, Vertex AI, BigQuery, Storage y Auth |
| **Key Privada** | `Back/firebase-key.json` | Generada localmente (ignorada en `.gitignore`) |
| **Dataset BigQuery** | `go-fest-506814:metricas_desastre` (Location: `US`) | Creado para métricas agregadas |
| **Mock Data** | 21 documentos en Firestore | Sembrados en colecciones `usuarios`, `zonas`, `damnificados`, `donaciones` |
| **Variables `.env`** | `Back/.env` | Generado con credenciales, proyecto, bucket, Maps API key y timeouts |

---

## 2. APIs de Google Cloud Habilitadas

Se habilitaron las siguientes APIs en el proyecto `go-fest-506814`:
- `aiplatform.googleapis.com` — Vertex AI / Generative AI
- `firestore.googleapis.com` — Cloud Firestore API
- `bigquery.googleapis.com` — BigQuery Analytics API
- `firebasestorage.googleapis.com` / `storage.googleapis.com` — Cloud Storage
- `identitytoolkit.googleapis.com` — Firebase Authentication
- `maps-backend.googleapis.com` — Maps JavaScript API
- `directions-backend.googleapis.com` — Directions API
- `geocoding-backend.googleapis.com` — Geocoding API

---

## 3. Datos Iniciales Sembrados en Firestore

El script `Back/scripts/cargar_mock.py` pobló las colecciones con los datos de demo de `data/mock/*.json`:

1. **`usuarios`** (8 documentos):
   - `usr-damnificado-1`: Damnificado Demo (`damnificado.demo@modus.local`, rol: `damnificado`)
   - `usr-donante-1`: Postobón S.A. (`donante1.demo@modus.local`, rol: `donante`)
   - `usr-donante-2`: Cementos del Pacífico (`donante2.demo@modus.local`, rol: `donante`)
   - `usr-donante-3`: Donante Particular Demo (`donante3.demo@modus.local`, rol: `donante`)
   - `usr-empresa-1`: Cruz Roja Colombiana (`empresa1.demo@modus.local`, rol: `empresa_beneficiaria`)
   - `usr-empresa-2`: ICBF Regional Guajira (`empresa2.demo@modus.local`, rol: `empresa_beneficiaria`)
   - `usr-entidad-1`: UNGRD Coordinación Nacional (`entidad1.demo@modus.local`, rol: `entidad_respuesta`)
   - `usr-estado-1`: Estado Colombiano — Panel Nacional (`estado1.demo@modus.local`, rol: `estado`)
2. **`zonas`** (5 zonas críticas de emergencia):
   - `zona-mocoa`, `zona-armenia`, `zona-popayan`, `zona-pasto`, `zona-cucuta`
3. **`damnificados`** (5 reportes iniciales vinculados a zonas).
4. **`donaciones`** (3 registros de donaciones con asignación y estado).

---

## 4. Verificación de Funcionamiento

- **Tests unitarios:** 7 tests ejecutados con `pytest` en `Back/tests` pasaron satisfactoriamente (100% de éxito).
- **Conectividad Firestore:** Verificada con llamada en vivo a `GET /zonas/publicas`, obteniendo las 5 zonas cargadas en la nube.
- **BigQuery:** Dataset `metricas_desastre` verificado mediante `bq ls`.

---

## 5. Plan de Contingencia: ¿Qué hacer si la facturación expira hoy?

Si la cuenta de créditos de la hackatón se agota o vence, el sistema cuenta con **3 niveles de respaldo inmediato** para garantizar que la presentación y la demo en vivo nunca fallen:

### Opción 1: Modo Resiliencia / Fallback Automático (Sin cambios de código)
En `Back/.env`, basta cambiar:
```ini
AGENTS_FORCE_FALLBACK=true
```
- Los agentes de Diagnóstico y Priorización utilizarán sus **reglas heurísticas deterministas** locales.
- No realizarán peticiones a Vertex AI, manteniendo la latencia por debajo de 50 ms.
- Las respuestas mantendrán el contrato estricto de agentes (incluyendo `datos_usados`).

### Opción 2: Modo Mock en Frontend
En `frontend/.env`:
```ini
VITE_USE_MOCK=true
```
- El frontend renderizará la interfaz completa con datos de demostración locales si el backend o la nube no están disponibles.

### Opción 3: Emulador Local de Firebase
Para correr Firestore, Auth y Storage en tu computador de forma 100% gratuita y sin internet:
```bash
firebase emulators:start --only firestore,auth,storage
```

---

## 6. Pasos Opcionales Recomendados en Consola Web

1. **Vertex AI Model Garden:** 
   Si deseas utilizar llamadas reales a Gemini 2.0 Flash en lugar del fallback simulado, ingresa a [Google Cloud Console Vertex AI](https://console.cloud.google.com/vertex-ai?project=go-fest-506814) y acepta los términos de uso del Model Garden si la consola lo solicita.
2. **Firebase Authentication (UI):**
   Si vas a usar la pantalla de login con usuario/contraseña desde el cliente frontend, ve a [Firebase Console > Authentication](https://console.firebase.google.com/project/go-fest-506814/authentication) y activa el proveedor **Correo electrónico / Contraseña**.
