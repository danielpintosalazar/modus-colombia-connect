# Análisis del frontend — Fase 0

> Generado automáticamente antes de escribir el backend. Repetir este análisis si `frontend/` cambia significativamente.

## Stack del frontend

- **React 19** + **TanStack Start / Router** (file-based routing, `src/routes/`), no Next.js/Vite SPA puro.
- Estilos: Tailwind v4 + shadcn/radix (`src/components/ui/`).
- Sin capa de datos remota: **no hay `fetch`, `axios`, SDK de Firebase, ni `import.meta.env` / `VITE_*`** en todo `src/`. Cero archivos `.env*`.
- Todo el estado viene de datos mock estáticos en TypeScript: [`src/lib/modus-data.ts`](../frontend/src/lib/modus-data.ts).

**Conclusión clave: el frontend hoy no asume ningún contrato de API real.** Es nuestra ventaja — el backend puede definir el contrato limpio (sección 6 del plan) sin pelear contra suposiciones previas. El mock de `modus-data.ts` es la mejor pista de qué *forma de datos* espera la UI, aunque sus nombres de campo están en inglés/camelCase y no coinciden 1:1 con el esquema Firestore en español del plan (sección 5).

## Rutas / vistas ya existentes

- `src/routes/index.tsx` — portal público / listado de emergencias.
- `src/routes/emergencia.$id.tsx` — detalle de una emergencia por id.
- `src/routes/__root.tsx` — layout raíz.

## Componentes por rol (mapeo a los 5 actores del plan)

| Componente frontend | Actor del plan (sección 2) |
|---|---|
| `VictimLightView.tsx` | Damnificado |
| `PrivateDonorView.tsx` | Donante particular / empresa donante |
| `GovDonorView.tsx` | Estado (como donante/financiador público) |
| `ResponseEntityView.tsx` | Entidad de respuesta (no está en la lista original de 5 actores del plan, pero el frontend ya la modela como rol propio — ver "Desalineamientos") |
| `ActorCards.tsx`, `RoleSwitcher.tsx` | Selector de rol / cambio de vista (no hay auth real, es un switch local) |
| `PublicPortal.tsx`, `EmergencyMap.tsx`, `EmergencyCarousel.tsx` | Vista pública, sin rol — monitoreo de zonas |
| `ReportEmergencyDialog.tsx` | Reporte de nueva emergencia/damnificado |
| `InitiativeDetailDialog.tsx` | Detalle de iniciativa/orden de despliegue |

## Shape de datos que la UI ya consume (de `modus-data.ts`)

- `Emergency` → equivalente a `zonas/` del esquema Firestore, pero con más campos: `severity` (`critical|medium|low`, no `destruida|parcial|segura` como en el contrato del Agente Diagnóstico), `x`/`y` (posición % en mapa 2D, no lat/lng real ni GeoPoint), `aiNeeds: string[]`, `teams: string[]`, `riskSource`, `nationalPriority`.
- `Donor` → no existe en el esquema Firestore del plan; el plan modela donaciones (`donaciones/`) pero no un catálogo de donantes rankeado. Habría que derivarlo agregando `donaciones/` por `donante_id`.
- `Initiative` → se parece a una vista agregada de `ordenes_despliegue/` + progreso, no a un documento único del esquema actual.
- `FieldTeam`, `RiskZone`, `Need`, `RiskAlert`, `StateEntity`, `CollectionCenter` → no tienen equivalente directo en el esquema Firestore de la sección 5 del plan.

## Autenticación

- **No hay ningún SDK de Firebase Auth ni contexto de usuario/rol real.** `RoleSwitcher.tsx` sugiere que el rol se selecciona localmente (probablemente estado de UI), no vía sesión autenticada.
- El middleware de Firebase Auth + custom claims que pide la Fase 1 del plan backend **no tiene aún ningún consumidor real en el frontend** — se implementa igual porque es requisito no funcional del jurado, pero no bloquea al frontend actual.

## Qué falta por definir (para el equipo, no solo para mí)

1. Si el mapa seguirá siendo posicional `x/y` (%) o pasará a lat/lng real vía Google Maps API (el plan pide Maps API — el frontend hoy no la usa en absoluto).
2. Si el frontend adoptará los nombres de campo en español del esquema Firestore o si el backend debe traducir/adaptar la forma de `Emergency`/`Donor`/`Initiative` al servir las respuestas.
3. Quién conecta Firebase Auth al `RoleSwitcher` actual (fuera de mi alcance de backend, pero afecta el contrato de middleware).

## Decisión de esta fase

El frontend conserva su estructura y lógica visual. El backend sigue el contrato "canónico" definido en el plan (español, esquema Firestore de la sección 5), y cualquier adaptación se limita a una capa de integración explícita para acercarse a la forma que la UI ya espera (p. ej. `GET /metricas` para alimentar vistas tipo `Donor`/`Initiative`).

## Fase 4 — primer puente de integración

- `GET /zonas/publicas` expone las zonas agregadas sin exigir Firebase Auth, porque el portal público no tiene sesión ni token.
- El frontend consume ese endpoint en el detalle de una emergencia mediante `src/lib/modus-api.ts` y conserva `modus-data.ts` como fallback si el backend no está disponible.
- La adaptación conserva los IDs visuales del frontend cuando encuentra una emergencia equivalente; esto evita romper URLs existentes, aunque los IDs canónicos (`zona-mocoa`) y visuales (`EMG-2026-041`) siguen siendo distintos.
- Donantes, iniciativas, equipos y alertas todavía no tienen una fuente equivalente en el backend. No se sustituyen silenciosamente por datos parciales: siguen siendo mock hasta definir endpoints agregados y sus contratos.

### Fase 4.1 — modo offline explícito + portal detrás de una sola costura

- `src/lib/modus-api.ts` ahora tiene **modo mock explícito**: si `VITE_API_URL` está vacía o `VITE_USE_MOCK=true`, no se hace ningún `fetch`. Con backend definido, el `fetch` lleva `AbortController` con timeout de 2,5 s para que un backend a medio levantar no cuelgue el `loader`.
- `getDataSource()` reporta si los últimos datos vinieron de `"backend"` o `"mock"`; el footer del portal muestra "datos en vivo" / "datos de demostración (sin backend)".
- El adaptador incorpora, sin depender de la conexión:
  - **Proyección `lat/lng → x/y`** con bounding box de Colombia, para que los pines caigan bien cuando el backend entregue coordenadas reales.
  - **Mapa de IDs** `zona-* ↔ EMG-*` (`zoneIdAlias`) que reemplaza el emparejamiento frágil por nombre.
- El portal (`index.tsx` → `PublicPortal` → `EmergencyMap`, `EmergencyCarousel`) ahora recibe `emergencies` desde el `loader` de la ruta, que llama a `getPublicEmergencies()`. Offline devuelve el mock y la UI se ve igual; con backend, todo el portal (mapa, carrusel, KPI de afectados) se enciende con una sola bandera. Los componentes conservan un valor por defecto al import estático, así que no rompen tests ni otros usos.
- Config: `frontend/.env.example` (versionado) y `frontend/.env.local` (local, `*.local` está en `.gitignore`) con `VITE_USE_MOCK=true` para desarrollo sin backend.
- Docker (`docker compose up --build`): el frontend corre en modo `vite dev` (SSR) porque el build de producción del template apunta a Cloudflare Workers. El SSR habla con `http://backend:8000` (`API_URL_INTERNAL`) y el navegador con `http://localhost:8000` (`VITE_API_URL`); `modus-api.ts` elige según `import.meta.env.SSR`. Verificado extremo a extremo: la home renderiza en servidor con datos del backend ("datos en vivo" en el footer).
