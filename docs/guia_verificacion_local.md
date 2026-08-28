# Guía de Verificación y Ejecución Local — Modus Connect

Esta guía paso a paso te permite levantar el stack completo (Backend FastAPI + Frontend TanStack/React) en tu máquina local y realizar un recorrido interactivo de verificación antes de una demo o entrega.

---

## 🛠️ 1. Requisitos Previos y Archivos de Configuración

Verifica que existan estos archivos en tu workspace (ya generados automáticamente durante la configuración):

- `Back/.env` (Configuración de GCP `go-fest-506814`, bucket y variables).
- `Back/firebase-key.json` (Clave de cuenta de servicio para Firestore, Storage y BigQuery).
- `frontend/.env` (Apunta a `VITE_API_URL=http://localhost:8000` y `VITE_USE_MOCK=false`).

---

## 🚀 2. Cómo Correr la Aplicación en Local

Tienes **dos opciones** para correr el proyecto. La **Opción A** es la más rápida para desarrollo y depuración interactiva.

### Opción A — Ejecución Directa en Terminales (Recomendada)

Abre **dos terminales**:

#### Terminal 1 — Backend (FastAPI)
```powershell
cd c:\Users\DANIEL\Documents\hackaton\modus-colombia-connect\Back
python -m uvicorn app.main:app --reload --port 8000
```
> **Salida esperada:**
> ```text
> INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
> INFO:     Application startup complete.
> ```

#### Terminal 2 — Frontend (Vite / React)
```powershell
cd c:\Users\DANIEL\Documents\hackaton\modus-colombia-connect\frontend
npm run dev
```
> **Salida esperada:**
> ```text
> VITE v8.1.5  ready in ... ms
> ➜  Local:   http://localhost:8080/
> ```

---

### Opción B — Con Docker Compose (Todo el Stack)

Si prefieres levantar ambos servicios en contenedores aislados:
```powershell
cd c:\Users\DANIEL\Documents\hackaton\modus-colombia-connect
docker compose up --build
```
- Frontend disponible en: <http://localhost:8080>
- Backend disponible en: <http://localhost:8000>

---

## 🔍 3. Recorrido de Verificación Paso a Paso (Checklist de Prueba)

Sigue estos pasos en tu navegador para validar que cada capa del sistema funciona correctamente:

---

### Paso 1: Verificación del Backend & Swagger UI

1. **Health Check:**
   - Abre en el navegador: <http://localhost:8000/health>
   - **Resultado esperado:** `{"status":"ok","environment":"local"}`

2. **Explorador Interactivo OpenAPI (Swagger):**
   - Abre: <http://localhost:8000/docs>
   - Busca el endpoint **`GET /zonas/publicas`**, haz clic en *Try it out* y luego *Execute*.
   - **Resultado esperado:** Respuesta `200 OK` con las 5 zonas activas obtenidas en vivo desde Cloud Firestore (`zona-mocoa`, `zona-cundinamarca`, `zona-choco`, `zona-guajira`, `zona-santander`).

3. **Prueba del Agente Orquestador (`POST /chat`):**
   - En Swagger, expande **`POST /chat`** y envía el siguiente cuerpo de prueba:
   ```json
   {
     "rol": "damnificado",
     "mensaje": "Necesitamos agua potable y kits de primeros auxilios en el sector San Miguel de Mocoa",
     "contexto_usuario": {
       "zona_id": "zona-mocoa"
     }
   }
   ```
   - **Resultado esperado:** Código `200 OK`, con respuesta estructurada del agente, lista de `datos_usados` y `acciones_sugeridas`.

---

### Paso 2: Verificación del Frontend en el Navegador

Abre en tu navegador la URL del frontend: <http://localhost:8080>

#### A. Portal Público y Mapa Interactivo (`/`)
- **Mapa de Colombia:** Debes ver los pines de emergencia distribuidos geográficamente en Mocoa, Chocó, Cundinamarca, Santander y Guajira (calculados con la proyección `lat/lng → x/y`).
- **Estado de Conexión en el Footer:** En el pie de página del portal debe figurar el badge de **datos en vivo** (indicando que el frontend se conectó exitosamente a `http://localhost:8000/zonas/publicas`).
- **Carrusel y Métricas:** Revisa que el total de afectados y las tarjetas de emergencia reflejen los datos agregados. Haz clic en una emergencia (ej. Mocoa) para abrir el detalle.

#### B. Barra Superior de Cambio de Rol (Role Switcher)
Prueba la navegación entre los 4 perfiles en la barra superior:

1. **Damnificado (`VictimLightView`):**
   - Vista ultraligera optimizada para conexiones móviles lentas.
   - Permite reportar ubicación, número de familiares afectados y necesidades críticas (Agua, Alimentos, Techo, Salud).

2. **Donante Sector Privado (CSR Dashboard):**
   - Tablero con balance en 3 ejes: Ambiental, Social y Económico.
   - Catálogo de iniciativas con porcentaje de avance y botón de inversión / donación.

3. **Donante Sector Público / Gobierno (`GovDonorView`):**
   - Tablero de comando regional por departamentos.
   - Gráfica comparativa de recursos movilizados (Sector Público vs Privado).
   - Asignación de centros de acopio y entidades de respuesta vinculadas.

4. **Entidad de Respuesta / Operativa (`ResponseEntityView`):**
   - Catálogo de necesidades identificadas por sector con score de urgencia.
   - Formulario de registro de avances en campo y entregas de suministros.

---

### Paso 3: Prueba de Resiliencia ante Fallos (Demostración de Fallback)

Esta prueba demuestra ante el jurado que el sistema **nunca se rompe ni muestra pantallas en blanco**, incluso si se cae internet o el backend:

1. Ve a la terminal del Backend y presiona `Ctrl + C` para detenerlo.
2. Recarga la página del Frontend en <http://localhost:8080>.
3. **Comportamiento esperado:** 
   - La aplicación carga sin errores.
   - El footer muestra el estado *"datos de demostración (sin backend)"*.
   - El mapa y los catálogos continúan funcionando fluidamente con los datos de contingencia de `modus-data.ts`.
4. Vuelve a iniciar el backend (`python -m uvicorn app.main:app --reload --port 8000`) y recarga la página: el frontend retoma automáticamente la conexión en vivo.

---

## 🧪 4. Pruebas Automatizadas del Backend

Para validar que toda la suite de lógica de negocio, scoring de prioridad y fallback de agentes está íntegra:

```powershell
cd c:\Users\DANIEL\Documents\hackaton\modus-colombia-connect\Back
pytest -v
```

> **Resultado esperado:** 7/7 tests aprobados (100% de éxito).
