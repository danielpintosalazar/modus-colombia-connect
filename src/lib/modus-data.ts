export type Severity = "critical" | "medium" | "low";

export type Emergency = {
  id: string;
  name: string;
  region: string;
  department: string;
  type: string;
  severity: Severity;
  affected: number;
  x: number; // % position on map
  y: number;
  riskSource: string;
  aiNeeds: string[];
  teams: string[];
  updated: string;
  responsible: string;
  nationalPriority: boolean;
};

export const emergencies: Emergency[] = [
  {
    id: "EMG-2026-041",
    name: "Deslizamiento sector San Miguel",
    region: "Mocoa",
    department: "Putumayo",
    type: "Deslizamiento / Reconstrucción urbana",
    severity: "critical",
    affected: 12840,
    x: 40,
    y: 74,
    riskSource: "UNGRD — Alerta roja hidrológica + análisis CNN de imágenes satelitales Sentinel-2",
    aiNeeds: ["Albergue temporal", "Agua potable", "Atención médica", "Remoción de escombros"],
    teams: ["UNGRD", "Defensa Civil", "Ejército Nacional — Batallón 27"],
    updated: "hace 12 min",
    responsible: "UNGRD — Coordinación Putumayo",
    nationalPriority: true,
  },
  {
    id: "EMG-2026-039",
    name: "Incendio forestal Cerros Orientales",
    region: "Cundinamarca",
    department: "Cundinamarca",
    type: "Incendio forestal / Reforestación",
    severity: "medium",
    affected: 4310,
    x: 46,
    y: 52,
    riskSource: "IDEAM — Índice de sequía severa + detección térmica dron autónomo",
    aiNeeds: ["Control de fuego", "Máscaras y salud respiratoria", "Reforestación post-evento"],
    teams: ["Bomberos Bogotá", "CAR Cundinamarca"],
    updated: "hace 38 min",
    responsible: "Bomberos Cundinamarca",
    nationalPriority: false,
  },
  {
    id: "EMG-2026-044",
    name: "Inundación cuenca río Atrato",
    region: "Chocó",
    department: "Chocó",
    type: "Inundación / Kits de alimentos",
    severity: "critical",
    affected: 21560,
    x: 30,
    y: 46,
    riskSource: "IDEAM — Nivel río Atrato en cota máxima histórica (sensores telemétricos)",
    aiNeeds: ["Kits de alimentos", "Agua potable", "Transporte fluvial", "Servicios esenciales"],
    teams: ["Cruz Roja Colombiana", "Armada Nacional", "Defensa Civil Chocó"],
    updated: "hace 4 min",
    responsible: "Cruz Roja Colombiana — Seccional Chocó",
    nationalPriority: true,
  },
  {
    id: "EMG-2026-032",
    name: "Sequía y desabastecimiento hídrico",
    region: "La Guajira",
    department: "La Guajira",
    type: "Sequía / Activación económica",
    severity: "low",
    affected: 8900,
    x: 55,
    y: 15,
    riskSource: "IDEAM — Fenómeno de El Niño, balance hídrico negativo 6 meses",
    aiNeeds: ["Agua potable", "Nutrición infantil", "Pozos comunitarios"],
    teams: ["UNGRD", "ICBF"],
    updated: "hace 2 h",
    responsible: "UNGRD — Coordinación La Guajira",
    nationalPriority: false,
  },
  {
    id: "EMG-2026-046",
    name: "Sismo superficial 5.1 Mw",
    region: "Santander",
    department: "Santander",
    type: "Terremoto / Evaluación estructural",
    severity: "medium",
    affected: 3120,
    x: 47,
    y: 33,
    riskSource: "SGC — Red Sismológica Nacional, epicentro Los Santos",
    aiNeeds: ["Evaluación estructural", "Albergue temporal", "Apoyo psicosocial"],
    teams: ["Defensa Civil Santander", "Bomberos Bucaramanga"],
    updated: "hace 1 h",
    responsible: "Defensa Civil Colombiana",
    nationalPriority: false,
  },
];

export type FieldTeam = { id: string; entity: string; region: string; x: number; y: number; staff: number };

export const fieldTeams: FieldTeam[] = [
  { id: "FT-1", entity: "Defensa Civil Colombiana", region: "Mocoa", x: 43, y: 70, staff: 84 },
  { id: "FT-2", entity: "Cruz Roja Colombiana", region: "Quibdó", x: 27, y: 42, staff: 61 },
  { id: "FT-3", entity: "Bomberos Bogotá", region: "Cundinamarca", x: 50, y: 55, staff: 47 },
  { id: "FT-4", entity: "Ejército Nacional", region: "Santander", x: 51, y: 30, staff: 130 },
];

export type RiskZone = { id: string; label: string; source: string; x: number; y: number; size: number };

export const riskZones: RiskZone[] = [
  { id: "RZ-1", label: "Zona de influencia — remoción en masa", source: "UNGRD", x: 40, y: 74, size: 20 },
  { id: "RZ-2", label: "Zona de riesgo — inundación lenta", source: "IDEAM", x: 30, y: 46, size: 26 },
  { id: "RZ-3", label: "Zona de riesgo — incendio de cobertura", source: "IDEAM", x: 46, y: 52, size: 16 },
];

export type Donor = {
  rank: number;
  name: string;
  initials: string;
  amount: string;
  projects: number;
  sector: "privado" | "publico";
  focus: string;
};

export const donors: Donor[] = [
  { rank: 1, name: "Grupo Energía Andina", initials: "GEA", amount: "$4.820M COP", projects: 14, sector: "privado", focus: "Resiliencia territorial" },
  { rank: 2, name: "Bancolombia Fundación", initials: "BF", amount: "$3.940M COP", projects: 11, sector: "privado", focus: "Recuperación de ingresos" },
  { rank: 3, name: "Cementos del Pacífico", initials: "CP", amount: "$3.110M COP", projects: 9, sector: "privado", focus: "Reconstrucción urbana" },
  { rank: 4, name: "Postobón S.A.", initials: "PO", amount: "$2.480M COP", projects: 12, sector: "privado", focus: "Agua y alimentos" },
  { rank: 5, name: "Ecopetrol", initials: "EC", amount: "$2.240M COP", projects: 8, sector: "privado", focus: "Servicios esenciales" },
  { rank: 6, name: "Sura Seguros", initials: "SS", amount: "$1.870M COP", projects: 7, sector: "privado", focus: "Salud" },
  { rank: 7, name: "Alpina", initials: "AL", amount: "$1.410M COP", projects: 6, sector: "privado", focus: "Nutrición" },
  { rank: 8, name: "Corona", initials: "CO", amount: "$1.180M COP", projects: 5, sector: "privado", focus: "Vivienda" },
  { rank: 9, name: "Nutresa", initials: "NU", amount: "$980M COP", projects: 5, sector: "privado", focus: "Kits alimentarios" },
  { rank: 10, name: "Claro Colombia", initials: "CL", amount: "$760M COP", projects: 4, sector: "privado", focus: "Conectividad" },
  { rank: 1, name: "UNGRD", initials: "UN", amount: "$18.400M COP", projects: 32, sector: "publico", focus: "Coordinación nacional" },
  { rank: 2, name: "Gobernación de Antioquia", initials: "GA", amount: "$7.250M COP", projects: 18, sector: "publico", focus: "Reconstrucción" },
  { rank: 3, name: "Alcaldía de Bogotá", initials: "AB", amount: "$6.930M COP", projects: 21, sector: "publico", focus: "Incendios y salud" },
  { rank: 4, name: "Gobernación del Chocó", initials: "GC", amount: "$4.510M COP", projects: 13, sector: "publico", focus: "Inundaciones" },
  { rank: 5, name: "Ministerio de Salud", initials: "MS", amount: "$4.120M COP", projects: 15, sector: "publico", focus: "Brigadas médicas" },
  { rank: 6, name: "Gobernación de Putumayo", initials: "GP", amount: "$3.640M COP", projects: 10, sector: "publico", focus: "Mocoa" },
  { rank: 7, name: "ICBF", initials: "IC", amount: "$2.980M COP", projects: 12, sector: "publico", focus: "Nutrición infantil" },
  { rank: 8, name: "Ejército Nacional", initials: "EN", amount: "$2.410M COP", projects: 9, sector: "publico", focus: "Logística" },
  { rank: 9, name: "CAR Cundinamarca", initials: "CA", amount: "$1.760M COP", projects: 8, sector: "publico", focus: "Reforestación" },
  { rank: 10, name: "Gobernación de La Guajira", initials: "GG", amount: "$1.240M COP", projects: 6, sector: "publico", focus: "Agua" },
];

export type Initiative = {
  id: string;
  title: string;
  region: string;
  status: "En Proceso" | "Concluido";
  progress: number;
  entity: string;
  area: string;
  population: number;
  investmentType: string;
  budget: string;
  actors: string[];
  description: string;
  multiplier: string;
  families: number;
  kits: number;
};

export const initiatives: Initiative[] = [
  {
    id: "INI-001",
    title: "Reconstrucción urbana barrio San Miguel",
    region: "Mocoa",
    status: "En Proceso",
    progress: 68,
    entity: "UNGRD + Cementos del Pacífico",
    area: "Zona de influencia alta — 3 comunas",
    population: 12840,
    investmentType: "Resiliencia Territorial",
    budget: "$8.400M COP",
    actors: ["UN", "CP", "DC", "GEA"],
    description:
      "Reconstrucción de 420 viviendas con estándar sismo-resistente, obras de mitigación en quebradas y recuperación de vías terciarias en el sector San Miguel tras el deslizamiento.",
    multiplier: "$1,00 COP invertido = $2,40 COP generados en la comunidad",
    families: 3120,
    kits: 4180,
  },
  {
    id: "INI-002",
    title: "Reforestación y control de incendios Cerros Orientales",
    region: "Cundinamarca",
    status: "En Proceso",
    progress: 41,
    entity: "CAR Cundinamarca + Grupo Energía Andina",
    area: "Zona de influencia media — 7 veredas",
    population: 4310,
    investmentType: "Resiliencia Territorial",
    budget: "$3.150M COP",
    actors: ["CA", "GEA", "BB"],
    description:
      "Siembra de 96.000 árboles nativos, brigadas comunitarias contra incendios y monitoreo satelital de cobertura vegetal con validación por visión computacional.",
    multiplier: "$1,00 COP invertido = $1,90 COP generados en la comunidad",
    families: 1180,
    kits: 640,
  },
  {
    id: "INI-003",
    title: "Kits de alimentos y servicios esenciales río Atrato",
    region: "Chocó",
    status: "En Proceso",
    progress: 84,
    entity: "Cruz Roja Colombiana + Postobón",
    area: "Zona de influencia crítica — 14 corregimientos",
    population: 21560,
    investmentType: "Servicios Esenciales",
    budget: "$5.720M COP",
    actors: ["CR", "PO", "AL", "GC"],
    description:
      "Entrega de 18.000 kits alimentarios y potabilización comunitaria mediante transporte fluvial, con trazabilidad de última milla por evidencia fotográfica georreferenciada.",
    multiplier: "$1,00 COP invertido = $2,80 COP generados en la comunidad",
    families: 5240,
    kits: 18000,
  },
  {
    id: "INI-004",
    title: "Reactivación económica de pescadores artesanales",
    region: "Chocó",
    status: "Concluido",
    progress: 100,
    entity: "Bancolombia Fundación",
    area: "Zona de influencia media — 5 corregimientos",
    population: 3400,
    investmentType: "Recuperación de Ingresos",
    budget: "$1.980M COP",
    actors: ["BF", "GC", "SE"],
    description:
      "Reposición de equipos de pesca, capital semilla y formación financiera para 640 familias afectadas por la inundación del Atrato.",
    multiplier: "$1,00 COP invertido = $3,10 COP generados en la comunidad",
    families: 640,
    kits: 720,
  },
  {
    id: "INI-005",
    title: "Brigadas de salud móvil y apoyo psicosocial",
    region: "Mocoa",
    status: "En Proceso",
    progress: 57,
    entity: "Ministerio de Salud + Sura",
    area: "Zona de influencia alta — 3 comunas",
    population: 9200,
    investmentType: "Servicios Esenciales",
    budget: "$2.340M COP",
    actors: ["MS", "SS", "CR"],
    description:
      "Doce brigadas médicas móviles, atención psicosocial a 2.400 personas y vigilancia epidemiológica en albergues temporales.",
    multiplier: "$1,00 COP invertido = $2,10 COP generados en la comunidad",
    families: 2280,
    kits: 1520,
  },
  {
    id: "INI-006",
    title: "Acceso a educación y conectividad en albergues",
    region: "Cundinamarca",
    status: "Concluido",
    progress: 100,
    entity: "Claro Colombia + Alcaldía de Bogotá",
    area: "Zona de influencia baja — 4 albergues",
    population: 1600,
    investmentType: "Acceso a Oportunidades",
    budget: "$820M COP",
    actors: ["CL", "AB"],
    description:
      "Aulas temporales conectadas, 480 tabletas y formación docente para continuidad educativa durante la emergencia.",
    multiplier: "$1,00 COP invertido = $1,70 COP generados en la comunidad",
    families: 420,
    kits: 480,
  },
];

export const investmentTypes = [
  "Acceso a Oportunidades",
  "Servicios Esenciales",
  "Recuperación de Ingresos",
  "Resiliencia Territorial",
] as const;

export const regions = ["Mocoa", "Cundinamarca", "Chocó", "La Guajira", "Santander"] as const;

export type StateEntity = {
  id: string;
  name: string;
  kind: string;
  available: number;
  status: "Disponible" | "Desplegada" | "En alistamiento";
  region: string;
};

export const stateEntities: StateEntity[] = [
  { id: "SE-1", name: "UNGRD", kind: "Coordinación nacional", available: 240, status: "Desplegada", region: "Nacional" },
  { id: "SE-2", name: "Defensa Civil Colombiana", kind: "Búsqueda y rescate", available: 180, status: "Desplegada", region: "Putumayo" },
  { id: "SE-3", name: "Ejército Nacional", kind: "Logística y seguridad", available: 620, status: "En alistamiento", region: "Santander" },
  { id: "SE-4", name: "Bomberos de Colombia", kind: "Incendios y rescate", available: 310, status: "Disponible", region: "Cundinamarca" },
  { id: "SE-5", name: "Cruz Roja Colombiana", kind: "Salud y ayuda humanitaria", available: 275, status: "Desplegada", region: "Chocó" },
  { id: "SE-6", name: "Armada Nacional", kind: "Transporte fluvial", available: 140, status: "Disponible", region: "Chocó" },
  { id: "SE-7", name: "ICBF", kind: "Protección y nutrición", available: 96, status: "Disponible", region: "La Guajira" },
  { id: "SE-8", name: "IDEAM", kind: "Monitoreo hidrometeorológico", available: 40, status: "Disponible", region: "Nacional" },
];

export type CollectionCenter = {
  id: string;
  name: string;
  city: string;
  entities: string[];
  capacity: string;
  validity: string;
};

export const collectionCenters: CollectionCenter[] = [
  { id: "CA-1", name: "Coliseo Municipal Mocoa", city: "Mocoa, Putumayo", entities: ["Defensa Civil", "Ejército Nacional"], capacity: "1.200 m³", validity: "12 ago — 30 sep 2026" },
  { id: "CA-2", name: "Bodega Aeropuerto El Caraño", city: "Quibdó, Chocó", entities: ["Cruz Roja", "Armada Nacional"], capacity: "2.800 m³", validity: "05 ago — 15 oct 2026" },
  { id: "CA-3", name: "Centro de Acopio Corferias", city: "Bogotá D.C.", entities: ["Bomberos Bogotá", "UNGRD"], capacity: "4.500 m³", validity: "01 jul — 31 dic 2026" },
];

export const mobilizedResources = [
  { type: "Incendio", publico: 3200, privado: 1850 },
  { type: "Terremoto", publico: 2100, privado: 900 },
  { type: "Reforestación", publico: 1450, privado: 2600 },
  { type: "Reconstrucción", publico: 5400, privado: 4100 },
  { type: "Alimentos", publico: 2800, privado: 3400 },
  { type: "Activación Econ.", publico: 1200, privado: 2900 },
];

export type Need = {
  id: string;
  title: string;
  domain: "Alimentos" | "Vivienda" | "Salud" | "Agua";
  region: string;
  people: number;
  urgency: number;
  severity: Severity;
  accessibility: string;
  linkedEntities: number;
  detail: string;
};

export const needs: Need[] = [
  { id: "ND-101", title: "18.000 kits alimentarios — corregimientos ribereños", domain: "Alimentos", region: "Chocó", people: 21560, urgency: 94, severity: "critical", accessibility: "Solo acceso fluvial", linkedEntities: 4, detail: "Población aislada por creciente del Atrato; se requiere despacho escalonado en lanchas de 3 t." },
  { id: "ND-102", title: "Albergue temporal para 420 familias", domain: "Vivienda", region: "Mocoa", people: 1680, urgency: 91, severity: "critical", accessibility: "Vía terciaria parcialmente habilitada", linkedEntities: 3, detail: "Carpas familiares, módulos sanitarios y energía temporal en zona segura fuera de la ronda hídrica." },
  { id: "ND-103", title: "Potabilización comunitaria 40.000 L/día", domain: "Agua", region: "Chocó", people: 9400, urgency: 88, severity: "critical", accessibility: "Acceso mixto", linkedEntities: 2, detail: "Plantas móviles y pastillas potabilizadoras; contaminación por sedimentos y aguas residuales." },
  { id: "ND-104", title: "Brigadas médicas y salud respiratoria", domain: "Salud", region: "Cundinamarca", people: 4310, urgency: 72, severity: "medium", accessibility: "Buen acceso vehicular", linkedEntities: 2, detail: "Afectación respiratoria por humo; se requieren nebulizadores, N95 y atención prioritaria a menores." },
  { id: "ND-105", title: "Evaluación estructural de 260 viviendas", domain: "Vivienda", region: "Santander", people: 3120, urgency: 66, severity: "medium", accessibility: "Buen acceso vehicular", linkedEntities: 1, detail: "Inspección post-sísmica con clasificación de habitabilidad y refuerzo de mampostería." },
  { id: "ND-106", title: "Nutrición infantil y complementación", domain: "Alimentos", region: "La Guajira", people: 8900, urgency: 58, severity: "low", accessibility: "Trocha, requiere 4x4", linkedEntities: 2, detail: "Complementación nutricional en comunidades wayúu con seguimiento antropométrico mensual." },
];

export type RiskAlert = {
  id: string;
  source: "UNGRD" | "IDEAM" | "Satélite / CNN" | "Dron" | "SGC";
  title: string;
  detail: string;
  severity: Severity;
  time: string;
  confidence: number;
};

export const riskAlerts: RiskAlert[] = [
  { id: "AL-1", source: "IDEAM", title: "Nivel río Atrato +2,4 m en 6 h", detail: "Umbral de alerta roja superado en estación Quibdó. Proyección de desborde en 9 h para 6 corregimientos.", severity: "critical", time: "hace 4 min", confidence: 96 },
  { id: "AL-2", source: "Satélite / CNN", title: "Nueva cicatriz de deslizamiento 3,2 ha", detail: "Modelo CNN detecta remoción en masa activa en ladera nororiental de Mocoa sobre imagen Sentinel-2 del 27/08.", severity: "critical", time: "hace 12 min", confidence: 91 },
  { id: "AL-3", source: "Dron", title: "Foco térmico reactivado — Cerro Guadalupe", detail: "Vuelo autónomo detecta 3 focos con temperatura > 340 °C y viento sostenido de 18 km/h.", severity: "medium", time: "hace 27 min", confidence: 88 },
  { id: "AL-4", source: "UNGRD", title: "Declaratoria de calamidad pública — Mocoa", detail: "Consejo municipal de gestión del riesgo activa protocolo de respuesta nivel 3.", severity: "medium", time: "hace 1 h", confidence: 100 },
  { id: "AL-5", source: "SGC", title: "Réplica sísmica 3,4 Mw — Los Santos", detail: "Profundidad 148 km, sin reporte de daños adicionales. Monitoreo continuo activo.", severity: "low", time: "hace 2 h", confidence: 99 },
];

export const severityLabel: Record<Severity, string> = {
  critical: "Crítica",
  medium: "Media",
  low: "Baja",
};
