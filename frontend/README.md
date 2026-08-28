# Modus Aid Network

Create a modern, fully responsive web application called "Modus - Plataforma Integral de Atención de Desastres (Colombia)" designed to optimize disaster response, resource allocation, and tracking.

### GLOBAL LAYOUT & ROLE SWITCHER

- Header with a prominent "Role Switcher" bar at the top with 4 views:

  1. Portal Público / Damnificado

  2. Donante Sector Privado (RSE)

  3. Donante Sector Público / Gobierno

  4. Entidad de Respuesta / Operativa

- Theme: Clean, modern UI using Tailwind CSS (Deep Slate/Navy backgrounds, Emergency Orange/Red accents for critical alerts, Emerald Green for CSR/impact, Electric Blue for tech/AI data).

- Persistent top-right "Reportar Emergencia" floating button (Red pulse animation).

---

### ROLE 1: PORTAL PÚBLICO & DAMNIFICADO

1. Hero Section:

   - Title: "Modus"

   - Subtitle: "Tú también puedes ayudar. Plataforma de coordinación y atención en tiempo real ante desastres en Colombia."

   - Quick action buttons: "Reportar Emergencia" and "Buscar Ayuda / Registrarse como Beneficiario".

2. Interactive Emergency Map Component:

   - Filterable Leaflet/Mapbox placeholder map showing:

     * Active Emergencies (Color-coded by severity: Red = Critical, Orange = Medium, Yellow = Low).

     * Response Entities deployed in the field (Blue icons).

     * Affected influence zones and UNGRD risk zones.

     * Clickable map pins that open a modal with details (Source of risk data, AI-detected primary needs, active response teams).

3. Top 10 Donors Leaderboard:

   - Tabbed component: "Sector Privado" vs "Sector Público".

   - Shows rank, organization name, avatar/logo, total funds/resources contributed, and verified projects supported.

4. Public Initiatives & Reports Catalog:

   - Grid of execution reports filtered by Colombian region (e.g., Mocoa, Cundinamarca, Chocó).

   - Each card displays: Region, Status (En Proceso / Concluido), AI-validated progress bar, lead response entity, and a "Ver Reporte de Impacto" button.

5. Emergency Report Modal (Multi-modal):

   - Options to report via: Voice Note (simulated audio recorder), Image Upload (with AI auto-tagging preview), or Text description.

   - Badge: "Ubicación GPS capturada automáticamente del dispositivo".

6. Lightweight Mobile Victim View (Ultraligera):

   - Accessible via toggle: Allows victims to submit location, number of family members, primary needs (Food, Shelter, Medical, Water), apply as a beneficiary, and track estimated arrival time of aid logistics.

---

### ROLE 2: DONANTE SECTOR PRIVADO (CSR DASHBOARD)

1. Corporate Social Responsibility (CSR) Executive Overview:

   - Metrics grid showing Company Balance across 3 axes: Ambientales (e.g., hectares reforested), Sociales (e.g., families assisted), and Económicas (e.g., local revenue generated).

2. AI-Prioritized Recommendations:

   - Banner displaying AI-recommended donation targets based on priority sectors (Alimentos, Salud, Construcción, Resiliencia).

3. Initiatives Marketplace / Catalog:

   - Search & filters: By Area, Progress %, and Investment Type (Acceso a Oportunidades, Servicios Esenciales, Recuperación de Ingresos, Resiliencia Territorial).

   - Project Cards featuring:

     * Influence area badge & impacted population count.

     * Avatar list of currently participating actors (Entities & Donors).

     * Quick "Invertir / Donar" button.

4. Initiative Deep-Dive & Traceability View:

   - Interactive Before/After Image Slider ($T_0$ Disaster vs $T_1$ AI Evolutionary Progress Validation).

   - Detailed description and responsible Response Entity.

   - ROI & CSR Impact Insights: Families reached, total delivered kits, and calculated multiplier effect (e.g., "$1.00 COP invertido = $2.40 COP generados en la comunidad").

---

### ROLE 3: DONANTE SECTOR PÚBLICO / GOBIERNO

1. Regional Priority Command Dashboard:

   - Priority emergencies filtered by Region / Department.

   - Comparative Bar/Donut Chart showing "Recursos Movilizados" (Public vs Private contributions) across emergency types (Incendio, Terremoto, Reforestación, Reconstrucción, Alimentos, Activación Económica).

2. State Entity Catalog & Dispatch Manager:

   - List of governmental and reaction entities (UNGRD, Defensa Civil, Ejército Nacional, Bomberos, etc.).

   - Action: "Notificar Participación Requerida" to assign them directly to high-priority emergencies as an immediate response group.

3. Collection Centers (Centros de Acopio) Allocation:

   - Form and interactive list to assign collection points, available state entities present, storage capacity, and active validity date ranges.

4. Direct Action Controls:

   - Actions on active emergency cards: "Contactar Responsable de la Iniciativa" or "Declarar Iniciativa de Prioridad Nacional".

---

### ROLE 4: ENTIDADES DE RESPUESTA (OPERATIVE WORKSPACE)

1. AI Diagnosis & Risk Feeds:

   - Real-time notification feed showing incoming automated risk alerts from connected open data systems (UNGRD, IDEAM) and satellite/drone CNN analysis.

2. Needs Catalog & Claiming System:

   - Filterable catalog of identified population needs by domain (Alimentos, Vivienda, Salud, Agua).

   - Card info: Need details, urgency score calculated by AI (Severity + Population + Accessibility), and number of other linked entities.

   - Action buttons: "Vincularse a esta Necesidad" and "Reportar Suministros Entregados".

3. Field Progress Reporting Tool:

   - Form to log field deliveries, progress updates, and upload post-intervention evidence ($T_1$ stage photos).

4. Campaign & Initiative Creator Wizard:

   - Form to launch support campaigns for public/private donors, specifying target zones, project description, impact goals, and required resources.

---

### MOCK DATA STRATEGY

- Pre-populate all views with realistic, high-fidelity Colombia-based scenarios:

  1. Mocoa (Deslizamiento / Reconstrucción urbana)

  2. Cundinamarca (Incendio Forestal / Reforestación)

  3. Chocó (Inundación / Kit de Alimentos y Servicios Esenciales)

- Include interactive modals, smooth state changes when switching roles, and toast notifications when forms or actions are submitted.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://modus-colombia-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/79de24da-fe8b-4238-ba48-a611e8f496c4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Desarrollo Local e Integración con Backend

El frontend se conecta al backend FastAPI mediante `src/lib/modus-api.ts` y soporta tanto ejecución standalone con datos mock como conexión directa a la API en vivo.

### 1. Variables de Entorno (`frontend/.env`)

```ini
# URL del backend FastAPI local
VITE_API_URL=http://localhost:8000

# false = consumir datos en vivo del backend; true = forzar mock local
VITE_USE_MOCK=false
```

### 2. Instalación y Ejecución

```sh
cd frontend
npm install
npm run dev
```

El servidor Vite levantará en <http://localhost:8080> (o el puerto que indique la consola). Al abrir el navegador, el portal consumirá las zonas en vivo desde `http://localhost:8000/zonas/publicas` (alimentadas por Firestore). Si el backend se apaga, la aplicación cae automáticamente en modo de contingencia local mostrando los datos mock sin interrumpir la experiencia.

