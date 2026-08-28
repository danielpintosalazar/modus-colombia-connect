import { emergencies as fallbackEmergencies, type Emergency } from "@/lib/modus-data";

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

export async function getPublicEmergencies(): Promise<Emergency[]> {
  if (forceMock) {
    lastDataSource = "mock";
    return fallbackEmergencies;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(`${apiBaseUrl}/zonas/publicas`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`API respondió ${response.status}`);
    const zones = (await response.json()) as PublicZone[];
    if (!Array.isArray(zones) || zones.length === 0) throw new Error("respuesta vacía");
    lastDataSource = "backend";
    return zones.map(toEmergency);
  } catch {
    lastDataSource = "mock";
    return fallbackEmergencies;
  }
}
