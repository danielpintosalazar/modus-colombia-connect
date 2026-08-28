import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { AlertTriangle, Layers, MapPin, RefreshCw, Satellite, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fieldTeams,
  riskZones,
  type Emergency,
  type FieldTeam,
  type RiskZone,
  type Severity,
} from "@/lib/modus-data";

const severityColors: Record<Severity, string> = {
  critical: "#ef4444",
  medium: "#f97316",
  low: "#eab308",
};

interface GoogleEmergencyMapProps {
  emergencies: Emergency[];
  showTeams: boolean;
  showZones: boolean;
  onSelect: (emergency: Emergency) => void;
  onFallbackRequest?: () => void;
}

let isGoogleMapsConfigured = false;

export function GoogleEmergencyMap({
  emergencies,
  showTeams,
  showZones,
  onSelect,
  onFallbackRequest,
}: GoogleEmergencyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markersRef = useRef<google.maps.Marker[]>([]);
  const teamMarkersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  // 1. Inicializar Google Maps
  useEffect(() => {
    const apiKey = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"]?.trim();

    if (!apiKey) {
      setError("VITE_GOOGLE_MAPS_API_KEY no configurada");
      setIsLoading(false);
      return;
    }

    if (!isGoogleMapsConfigured) {
      setOptions({
        key: apiKey,
        v: "weekly",
      });
      isGoogleMapsConfigured = true;
    }

    let isMounted = true;

    Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("geometry"),
    ])
      .then(([mapsLib]) => {
        if (!isMounted || !mapRef.current) return;

        const { Map } = mapsLib as google.maps.MapsLibrary;
        const map = new Map(mapRef.current, {
          center: { lat: 4.5709, lng: -74.2973 }, // Centro geográfico de Colombia
          zoom: 6,
          minZoom: 5,
          maxZoom: 16,
          mapTypeId: mapType,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        setMapInstance(map);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error cargando Google Maps:", err);
        setError("No se pudo cargar Google Maps API");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Cambiar tipo de mapa (Estándar Roadmap vs Satelital Híbrido)
  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.setMapTypeId(mapType);
  }, [mapType, mapInstance]);

  // 3. Renderizar Marcadores de Emergencias
  useEffect(() => {
    if (!mapInstance || typeof google === "undefined") return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    emergencies.forEach((e) => {
      const color = severityColors[e.severity];

      // SVG personalizado para el marcador con halo de alerta
      const svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
          <circle cx="19" cy="18" r="16" fill="${color}" fill-opacity="0.3"/>
          <path d="M19 0C8.5 0 0 8.5 0 19c0 14.5 19 29 19 29s19-14.5 19-29C38 8.5 29.5 0 19 0z" fill="${color}"/>
          <circle cx="19" cy="18" r="7" fill="#ffffff"/>
        </svg>
      `)}`;

      const marker = new google.maps.Marker({
        position: { lat: e.lat, lng: e.lng },
        map: mapInstance,
        title: `${e.name} (${e.region}) - ${e.affected.toLocaleString("es-CO")} afectados`,
        icon: {
          url: svgIcon,
          scaledSize: new google.maps.Size(34, 44),
          anchor: new google.maps.Point(17, 44),
        },
        ...(e.severity === "critical" ? { animation: google.maps.Animation.DROP } : {}),
      });

      marker.addListener("click", () => {
        onSelect(e);
      });

      markersRef.current.push(marker);
    });
  }, [mapInstance, emergencies, onSelect]);

  // 4. Renderizar Equipos Desplegados en Campo
  useEffect(() => {
    if (!mapInstance || typeof google === "undefined") return;

    teamMarkersRef.current.forEach((m) => m.setMap(null));
    teamMarkersRef.current = [];

    if (showTeams) {
      fieldTeams.forEach((t: FieldTeam) => {
        const teamSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
            <rect width="30" height="30" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
            <path d="M15 6L7 10v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11v-6l-8-4z" fill="#3b82f6"/>
            <path d="M13 15l2 2 4-4" stroke="#ffffff" stroke-width="2" fill="none"/>
          </svg>
        `)}`;

        const marker = new google.maps.Marker({
          position: { lat: t.lat, lng: t.lng },
          map: mapInstance,
          title: `${t.entity} (${t.staff} efectivos en ${t.region})`,
          icon: {
            url: teamSvg,
            scaledSize: new google.maps.Size(26, 26),
            anchor: new google.maps.Point(13, 13),
          },
        });

        teamMarkersRef.current.push(marker);
      });
    }
  }, [mapInstance, showTeams]);

  // 5. Renderizar Zonas de Riesgo / Polígonos UNGRD
  useEffect(() => {
    if (!mapInstance || typeof google === "undefined") return;

    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    if (showZones) {
      riskZones.forEach((z: RiskZone) => {
        const circle = new google.maps.Circle({
          map: mapInstance,
          center: { lat: z.lat, lng: z.lng },
          radius: z.radiusKm * 1000,
          fillColor: "#38bdf8",
          fillOpacity: 0.15,
          strokeColor: "#38bdf8",
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
        });

        circlesRef.current.push(circle);
      });
    }
  }, [mapInstance, showZones]);

  if (error) {
    return (
      <div className="flex h-[440px] w-full flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center sm:h-[560px]">
        <AlertTriangle className="mb-3 size-8 text-destructive" />
        <h4 className="text-base font-semibold text-foreground">Google Maps Platform no disponible</h4>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{error}</p>
        {onFallbackRequest && (
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onFallbackRequest}>
            <RefreshCw className="size-3.5" /> Usar mapa topográfico local
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-[440px] w-full sm:h-[560px]">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="size-4 animate-spin text-primary" />
            Cargando Google Maps (Colombia)...
          </div>
        </div>
      )}

      {/* Contenedor del mapa de Google */}
      <div ref={mapRef} className="h-full w-full rounded-2xl" />

      {/* Selector de capa vectorial / satélite */}
      <div className="absolute top-3 right-3 z-10 flex gap-1 rounded-lg border border-border bg-surface/90 p-1 shadow-md backdrop-blur-md">
        <Button
          size="sm"
          variant={mapType === "roadmap" ? "default" : "ghost"}
          className="h-7 gap-1 px-2.5 text-xs"
          onClick={() => setMapType("roadmap")}
        >
          <Layers className="size-3" /> Estándar
        </Button>
        <Button
          size="sm"
          variant={mapType === "hybrid" ? "default" : "ghost"}
          className="h-7 gap-1 px-2.5 text-xs"
          onClick={() => setMapType("hybrid")}
        >
          <Satellite className="size-3" /> Satélite
        </Button>
      </div>

      {/* Leyenda flotante */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 text-[11px]">
        <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
          <span className="size-2 rounded-full bg-critical" /> Crítica
        </span>
        <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
          <span className="size-2 rounded-full bg-warning" /> Media
        </span>
        <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
          <span className="size-2 rounded-full bg-low" /> Baja
        </span>
        <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-primary">
          <ShieldCheck className="size-3" /> Entidad en campo
        </span>
      </div>
    </div>
  );
}
