import {
  emergencies as fallbackEmergencies,
  initiatives as fallbackInitiatives,
  type Emergency,
  type Initiative,
} from "@/lib/modus-data";

type PublicZone = {
  id: string;
  nombre: string;
  ubicacion: { lat: number; lng: number; radio_km: number } | null;
  severidad: "critica" | "media" | "baja";
  sector_necesidad: string[];
  poblacion_afectada: number;
};

const browserBase = import.meta.env["VITE_API_URL"]?.trim() ?? "";
// En SSR (p. ej. dentro de un contenedor Docker) el backend puede vivir en otro
// hostname interno distinto al que ve el navegador. `API_URL_INTERNAL` lo cubre.
const serverBase =
  import.meta.env.SSR && typeof process !== "undefined"
    ? (process.env["API_URL_INTERNAL"]?.trim() ?? "")
    : "";
const rawBaseUrl = serverBase || browserBase;
const apiBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/$/, "") : "";
/** Sin URL de API, o con VITE_USE_MOCK=true, el front nunca toca la red. */
const forceMock = import.meta.env["VITE_USE_MOCK"] === "true" || apiBaseUrl === "";
const REQUEST_TIMEOUT_MS = 2500;

/** Fuente de los últimos datos servidos — para mostrar un badge "modo demo". */
export type DataSource = "backend" | "mock";
let lastDataSource: DataSource = "mock";
export function getDataSource(): DataSource {
  return lastDataSource;
}

/** IDs canónicos del backend ↔ IDs visuales que el frontend ya usa en sus rutas. */
const zoneIdAlias: Record<string, string> = {
  "zona-mocoa": "EMG-2026-041",
  "zona-cundinamarca": "EMG-2026-039",
  "zona-choco": "EMG-2026-044",
  "zona-guajira": "EMG-2026-032",
  "zona-santander": "EMG-2026-046",
};

/** Bounding box aproximado de Colombia continental, para ubicar pines en el mapa 2D. */
const COLOMBIA_BOUNDS = { latMin: -4.5, latMax: 13.5, lngMin: -79.5, lngMax: -66.8 };

function projectToMap(lat: number, lng: number): { x: number; y: number } {
  const { latMin, latMax, lngMin, lngMax } = COLOMBIA_BOUNDS;
  const clamp = (n: number) => Math.min(95, Math.max(5, n));
  const x = clamp(((lng - lngMin) / (lngMax - lngMin)) * 100);
  const y = clamp(((latMax - lat) / (latMax - latMin)) * 100);
  return { x: Math.round(x), y: Math.round(y) };
}

const severityMap: Record<PublicZone["severidad"], Emergency["severity"]> = {
  critica: "critical",
  media: "medium",
  baja: "low",
};

function matchFallback(zone: PublicZone): Emergency | undefined {
  const aliasId = zoneIdAlias[zone.id];
  return fallbackEmergencies.find((e) => e.id === aliasId || e.id === zone.id);
}

function toEmergency(zone: PublicZone): Emergency {
  const fallback = matchFallback(zone);
  const coords = fallback
    ? { x: fallback.x, y: fallback.y }
    : zone.ubicacion
      ? projectToMap(zone.ubicacion.lat, zone.ubicacion.lng)
      : { x: 50, y: 50 };

  if (fallback) {
    // Conserva textos ricos del mock (equipos, fuente de riesgo, cover por región)
    // y sobreescribe con los datos en vivo de Firestore (afectados, severidad, necesidades, lat/lng).
    return {
      ...fallback,
      severity: severityMap[zone.severidad],
      affected: zone.poblacion_afectada,
      aiNeeds: zone.sector_necesidad.length ? zone.sector_necesidad : fallback.aiNeeds,
      lat: zone.ubicacion?.lat ?? fallback.lat,
      lng: zone.ubicacion?.lng ?? fallback.lng,
      x: coords.x,
      y: coords.y,
      nationalPriority: zone.severidad === "critica",
    };
  }

  const [name, tail] = zone.nombre.split(" — ");
  return {
    id: zone.id,
    name: name ?? zone.nombre,
    region: tail?.split(", ")[0] ?? zone.nombre,
    department: tail?.split(", ")[1] ?? "Colombia",
    type: "Emergencia humanitaria",
    severity: severityMap[zone.severidad],
    affected: zone.poblacion_afectada,
    lat: zone.ubicacion?.lat ?? 4.5709,
    lng: zone.ubicacion?.lng ?? -74.2973,
    x: coords.x,
    y: coords.y,
    riskSource: "Modus — datos operativos",
    aiNeeds: zone.sector_necesidad,
    teams: [],
    updated: "actualizado recientemente",
    responsible: "Coordinación Modus",
    nationalPriority: zone.severidad === "critica",
  };
}

async function apiGet<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`API respondió ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function getPublicEmergencies(): Promise<Emergency[]> {
  if (forceMock) {
    lastDataSource = "mock";
    return fallbackEmergencies;
  }
  try {
    const zones = await apiGet<PublicZone[]>("/zonas/publicas");
    if (!Array.isArray(zones) || zones.length === 0) throw new Error("respuesta vacía");
    lastDataSource = "backend";
    return zones.map(toEmergency);
  } catch {
    lastDataSource = "mock";
    return fallbackEmergencies;
  }
}

// --- D3: iniciativas ---

type PublicIniciativa = {
  id: string;
  titulo: string;
  descripcion: string;
  zona_id: string;
  sector: string;
  actores: string[];
  poblacion_impactada: number;
  meta: string;
  progreso: number;
  estado: "propuesta" | "en_ejecucion" | "concluida";
};

const zoneRegion: Record<string, string> = {
  "zona-mocoa": "Mocoa",
  "zona-cundinamarca": "Cundinamarca",
  "zona-choco": "Chocó",
  "zona-guajira": "La Guajira",
  "zona-santander": "Santander",
};

const sectorInvestmentType: Record<string, string> = {
  alimentos: "Servicios Esenciales",
  vivienda: "Resiliencia Territorial",
  salud: "Servicios Esenciales",
  agua: "Servicios Esenciales",
  energia: "Resiliencia Territorial",
  transporte: "Resiliencia Territorial",
};

function shortCode(name: string): string {
  return name
    .replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function toInitiative(i: PublicIniciativa): Initiative {
  const progress = Math.round((i.progreso ?? 0) * 100);
  return {
    id: i.id,
    title: i.titulo,
    region: zoneRegion[i.zona_id] ?? "Colombia",
    status: i.estado === "concluida" ? "Concluido" : "En Proceso",
    progress,
    entity: i.actores[0] ?? "Coordinación Modus",
    area: i.meta,
    population: i.poblacion_impactada,
    investmentType: sectorInvestmentType[i.sector] ?? "Servicios Esenciales",
    budget: "Presupuesto en consolidación",
    actors: i.actores.map(shortCode),
    description: i.descripcion,
    multiplier: "Impacto en seguimiento por Modus",
    families: Math.round(i.poblacion_impactada / 3.4),
    kits: Math.round(i.poblacion_impactada * 0.3),
  };
}

export async function getPublicInitiatives(): Promise<Initiative[]> {
  if (forceMock) return fallbackInitiatives;
  try {
    const data = await apiGet<PublicIniciativa[]>("/iniciativas/publicas");
    if (!Array.isArray(data) || data.length === 0) throw new Error("respuesta vacía");
    return data.map(toInitiative);
  } catch {
    return fallbackInitiatives;
  }
}

// --- Auth ---

export type BackendRole =
  "damnificado" | "donante" | "empresa_beneficiaria" | "estado_entidad_respuesta";

const backendRoleFor: Record<string, BackendRole> = {
  publico: "damnificado",
  privado: "donante",
  gobierno: "estado_entidad_respuesta",
  entidad: "estado_entidad_respuesta",
};

/**
 * Proveedor del ID token real de Firebase. `src/lib/auth.tsx` lo registra al
 * montar si hay sesión; si devuelve null (SSR, Firebase no configurado o sin
 * sesión) se usa el dev-token del backend.
 */
type TokenProvider = () => Promise<string | null>;
let authTokenProvider: TokenProvider | null = null;

export function setAuthTokenProvider(provider: TokenProvider | null): void {
  authTokenProvider = provider;
}

/** Header Authorization: ID token real si hay sesión, si no dev-token para el rol de UI. */
export async function authHeaders(roleKey?: string): Promise<Record<string, string>> {
  if (authTokenProvider) {
    try {
      const token = await authTokenProvider();
      if (token) return { Authorization: `Bearer ${token}` };
    } catch {
      /* cae a dev-token */
    }
  }
  const rol = roleKey ? backendRoleFor[roleKey] : undefined;
  return rol ? { Authorization: `Bearer dev-token:${rol}` } : {};
}

type MeApi = { uid: string; rol: BackendRole; nombre: string; email: string };

/** Identidad resuelta por el backend para el token actual. null si no hay backend. */
export async function getMe(roleKey?: string): Promise<MeApi | null> {
  if (forceMock) return null;
  try {
    return await apiGet<MeApi>("/auth/me", { headers: await authHeaders(roleKey) });
  } catch {
    return null;
  }
}

// --- Fase 3: métricas ---

export type Metrics = {
  poblacionAfectadaTotal: number;
  zonasCriticas: number;
  deficitPorSector: { sector: string; poblacionConNecesidad: number; cantidadDonada: number }[];
  fuente: string;
};

type MetricsApi = {
  poblacion_afectada_total: number;
  zonas_criticas: number;
  fuente: string;
  deficit_por_sector: {
    sector: string;
    poblacion_con_necesidad: number;
    cantidad_donada: number;
  }[];
};

export async function getMetrics(roleKey?: string): Promise<Metrics | null> {
  if (forceMock) return null;
  try {
    const m = await apiGet<MetricsApi>("/metricas/", { headers: await authHeaders(roleKey) });
    return {
      poblacionAfectadaTotal: m.poblacion_afectada_total,
      zonasCriticas: m.zonas_criticas,
      fuente: m.fuente,
      deficitPorSector: m.deficit_por_sector.map((d) => ({
        sector: d.sector,
        poblacionConNecesidad: d.poblacion_con_necesidad,
        cantidadDonada: d.cantidad_donada,
      })),
    };
  } catch {
    return null;
  }
}

// --- Capa de escritura (POST/PATCH/upload con auth) ---

// Los agentes (Vertex/Gemini) pueden tardar; margen amplio para POST.
const WRITE_TIMEOUT_MS = 20000;

async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
  roleKey?: string,
): Promise<T> {
  const headers = { "Content-Type": "application/json", ...(await authHeaders(roleKey)) };
  return apiGet<T>(path, { method, headers, body: JSON.stringify(body) }, WRITE_TIMEOUT_MS);
}

/** Chat con el Agente Orquestador. */
export type ChatReply = { respuesta: string; datos_usados: string[]; acciones_sugeridas: string[] };
export async function postChat(
  roleKey: string,
  mensaje: string,
  contexto_usuario: Record<string, unknown> = {},
): Promise<ChatReply | null> {
  if (forceMock) return null;
  const rol = backendRoleFor[roleKey] ?? "damnificado";
  try {
    return await apiSend<ChatReply>("/chat", "POST", { rol, mensaje, contexto_usuario }, roleKey);
  } catch {
    return null;
  }
}

/** Reporte de damnificado (P0: zona + núcleo + necesidad + ubicación). */
export type DamnificadoInput = {
  zona_id: string;
  num_familiares: number;
  necesidad_principal:
    "alimentos" | "agua" | "vivienda" | "salud" | "energia" | "transporte" | "otro";
  ubicacion: { lat: number; lng: number };
};
export async function reportarDamnificado(input: DamnificadoInput, roleKey = "publico") {
  return apiSend<{ id: string }>("/damnificados/", "POST", input, roleKey);
}

/** Registrar una donación (rol donante). */
export type DonacionInput = {
  tipo: "dinero" | "especie" | "servicio";
  sector: "alimentos" | "vivienda" | "salud" | "agua" | "energia" | "transporte";
  cantidad: number;
  zona_asignada?: string | null;
};
export async function crearDonacion(input: DonacionInput, roleKey = "privado") {
  return apiSend<{ id: string; estado: string }>("/donaciones/", "POST", input, roleKey);
}
export async function getMisDonaciones(roleKey = "privado") {
  if (forceMock) return null;
  try {
    return await apiGet<
      {
        id: string;
        tipo: string;
        sector: string;
        cantidad: number;
        estado: string;
        zona_asignada: string | null;
      }[]
    >("/donaciones/mias", { headers: await authHeaders(roleKey) });
  } catch {
    return null;
  }
}

/** Catálogo de necesidades (rol estado_entidad_respuesta). */
export type Necesidad = {
  id: string;
  zona_id: string;
  tipo_necesidad: string;
  fuente: "manual" | "agente_diagnostico" | "sistema_riesgo";
  estado: "abierta" | "vinculada" | "cubierta" | "cerrada";
  entidad_vinculada_id: string | null;
};
export async function getNecesidades(roleKey = "entidad"): Promise<Necesidad[] | null> {
  if (forceMock) return null;
  try {
    return await apiGet<Necesidad[]>("/necesidades/", { headers: await authHeaders(roleKey) });
  } catch {
    return null;
  }
}
export async function vincularNecesidad(id: string, roleKey = "entidad") {
  return apiSend<Necesidad>(`/necesidades/${id}`, "PATCH", { vincular: true }, roleKey);
}
export async function actualizarEstadoNecesidad(
  id: string,
  estado: Necesidad["estado"],
  roleKey = "entidad",
) {
  return apiSend<Necesidad>(`/necesidades/${id}`, "PATCH", { estado }, roleKey);
}

/** Publicar una iniciativa / campaña (rol estado_entidad_respuesta). */
export type NuevaIniciativa = {
  titulo: string;
  descripcion: string;
  zona_id: string;
  sector: "alimentos" | "vivienda" | "salud" | "agua" | "energia" | "transporte";
  poblacion_impactada: number;
  meta: string;
  actores?: string[];
};
export async function crearIniciativa(input: NuevaIniciativa, roleKey = "gobierno") {
  return apiSend<{ id: string }>("/iniciativas/", "POST", input, roleKey);
}

/** Órdenes de despliegue (panel consolidado). */
export async function getOrdenesDespliegue(roleKey = "gobierno") {
  if (forceMock) return null;
  try {
    return await apiGet<
      {
        id: string;
        zona_id: string;
        recurso: string;
        cantidad: number;
        ruta_estimada: string | null;
      }[]
    >("/estado/ordenes-despliegue", { headers: await authHeaders(roleKey) });
  } catch {
    return null;
  }
}

/** Priorización de recursos por el agente (rol estado_entidad_respuesta). */
export type PriorizacionInput = {
  zonas: string[];
  recursos_disponibles: { recurso: string; cantidad: number }[];
};
export type OrdenPriorizada = {
  zona_id: string;
  recurso: string;
  cantidad: number;
  score_urgencia: number;
  justificacion: string;
};
export async function priorizarRecursos(input: PriorizacionInput, roleKey = "gobierno") {
  return apiSend<{ ordenes: OrdenPriorizada[]; datos_usados: string[] }>(
    "/agentes/priorizacion",
    "POST",
    input,
    roleKey,
  );
}

/** Subir imagen de evidencia a Cloud Storage. Devuelve URL firmada. */
export async function subirImagenReporte(
  file: File,
  roleKey = "publico",
): Promise<{ url: string; gs_uri: string } | null> {
  if (forceMock) return null;
  const form = new FormData();
  form.append("archivo", file);
  try {
    const response = await fetch(`${apiBaseUrl}/reportes/imagen`, {
      method: "POST",
      headers: await authHeaders(roleKey), // sin Content-Type: el navegador pone el boundary
      body: form,
    });
    if (!response.ok) throw new Error(`API respondió ${response.status}`);
    return (await response.json()) as { url: string; gs_uri: string };
  } catch {
    return null;
  }
}

// --- Operaciones de campo (avances, notificaciones, centros de acopio) ---

export type AvanceCampoInput = {
  iniciativa_id?: string | null;
  necesidad_id?: string | null;
  zona_id?: string | null;
  unidades_entregadas?: number;
  progreso_pct?: number;
  notas?: string;
  evidencia_url?: string | null;
};
export async function crearAvanceCampo(input: AvanceCampoInput, roleKey = "entidad") {
  return apiSend<{ id: string; progreso_pct: number }>("/avances/", "POST", input, roleKey);
}
export async function getAvances(roleKey = "entidad") {
  if (forceMock) return null;
  try {
    return await apiGet<
      {
        id: string;
        iniciativa_id: string | null;
        unidades_entregadas: number;
        progreso_pct: number;
        notas: string;
      }[]
    >("/avances/", { headers: await authHeaders(roleKey) });
  } catch {
    return null;
  }
}

export type CentroAcopio = {
  id: string;
  nombre: string;
  ciudad: string;
  entidades: string[];
  capacidad: string;
  vigencia: string;
  zona_id?: string | null;
};
export async function getCentrosAcopio(roleKey?: string): Promise<CentroAcopio[] | null> {
  if (forceMock) return null;
  try {
    return await apiGet<CentroAcopio[]>("/centros-acopio/", {
      headers: await authHeaders(roleKey),
    });
  } catch {
    return null;
  }
}
export type CentroAcopioInput = {
  nombre: string;
  ciudad: string;
  entidades?: string[];
  capacidad?: string;
  vigencia?: string;
  zona_id?: string | null;
};
export async function crearCentroAcopio(input: CentroAcopioInput, roleKey = "gobierno") {
  return apiSend<CentroAcopio>("/centros-acopio/", "POST", input, roleKey);
}

export type NotificacionEntidad = {
  id: string;
  entidad_nombre: string;
  motivo: string;
  zona_id: string | null;
  estado: "enviada" | "aceptada" | "rechazada";
};
export async function notificarEntidad(
  input: {
    entidad_nombre: string;
    motivo: string;
    zona_id?: string | null;
    emergencia_id?: string | null;
  },
  roleKey = "gobierno",
) {
  return apiSend<NotificacionEntidad>("/estado/notificaciones", "POST", input, roleKey);
}
export async function getNotificacionesEntidad(roleKey = "gobierno") {
  if (forceMock) return null;
  try {
    return await apiGet<NotificacionEntidad[]>("/estado/notificaciones", {
      headers: await authHeaders(roleKey),
    });
  } catch {
    return null;
  }
}

// --- Evidencias visuales (fase de análisis) ---

export type ResultadoBusqueda = {
  url: string;
  thumbnail: string | null;
  titulo: string;
  fuente: string;
  licencia: string;
  autor: string;
  pagina: string | null;
  ancho: number | null;
  alto: number | null;
};

export type Evidencia = {
  id: string;
  zona_id: string;
  gs_uri: string;
  url: string;
  origen: "subida" | "url_externa";
  tipo: "satelital_antes" | "satelital_despues" | "aerea" | "dron" | "terreno";
  fuente: string;
  licencia: string;
  fecha_captura: string | null;
  descripcion: string;
  diagnostico: {
    clasificacion: "destruida" | "parcial" | "segura";
    confianza: number;
    resumen: string;
    modo: string;
  } | null;
};

export async function buscarImagenes(
  q: string,
  fuente: "wikimedia" | "openverse" | "google" = "wikimedia",
  limite = 12,
  roleKey = "entidad",
): Promise<ResultadoBusqueda[]> {
  const qs = new URLSearchParams({ q, fuente, limite: String(limite) });
  return apiGet<ResultadoBusqueda[]>(
    `/evidencias/buscar?${qs}`,
    { headers: await authHeaders(roleKey) },
    WRITE_TIMEOUT_MS,
  );
}

export type EvidenciaDesdeUrlInput = {
  url: string;
  tipo: Evidencia["tipo"];
  fuente?: string;
  licencia?: string;
  fecha_captura?: string | null;
  descripcion?: string;
  pagina?: string | null;
  autor?: string | null;
  ejecutar_diagnostico?: boolean;
};
export async function registrarEvidenciaDesdeUrl(
  zonaId: string,
  input: EvidenciaDesdeUrlInput,
  roleKey = "entidad",
) {
  return apiSend<Evidencia>(`/zonas/${zonaId}/evidencias/desde-url`, "POST", input, roleKey);
}

export async function getEvidenciasDeZona(
  zonaId: string,
  roleKey = "entidad",
): Promise<Evidencia[] | null> {
  if (forceMock) return null;
  try {
    return await apiGet<Evidencia[]>(`/zonas/${zonaId}/evidencias`, {
      headers: await authHeaders(roleKey),
    });
  } catch {
    return null;
  }
}

export async function rediagnosticarEvidencia(id: string, roleKey = "entidad") {
  return apiSend<Evidencia>(`/evidencias/${id}/diagnostico`, "POST", {}, roleKey);
}
