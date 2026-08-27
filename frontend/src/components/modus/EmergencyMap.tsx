import { useMemo, useState } from "react";
import { AlertTriangle, Brain, Layers, MapPin, ShieldCheck, Users } from "lucide-react";
import mapImg from "@/assets/map-colombia.jpg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  emergencies as staticEmergencies,
  fieldTeams,
  riskZones,
  type Emergency,
  type Severity,
} from "@/lib/modus-data";
import { SectionHeading, SeverityBadge, severityDot } from "./common";

const severityFilters: { key: Severity; label: string }[] = [
  { key: "critical", label: "Crítica" },
  { key: "medium", label: "Media" },
  { key: "low", label: "Baja" },
];

export function EmergencyMap({ emergencies = staticEmergencies }: { emergencies?: Emergency[] }) {
  const [active, setActive] = useState<Severity[]>(["critical", "medium", "low"]);
  const [showTeams, setShowTeams] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [selected, setSelected] = useState<Emergency | null>(null);

  const visible = useMemo(
    () => emergencies.filter((e) => active.includes(e.severity)),
    [active, emergencies],
  );

  const toggle = (s: Severity) =>
    setActive((prev) => (prev.includes(s) ? prev.filter((p) => p !== s) : [...prev, s]));

  return (
    <section id="mapa" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Monitoreo en tiempo real"
        title="Mapa interactivo de emergencias"
        description="Emergencias activas, entidades desplegadas en campo y zonas de riesgo UNGRD / IDEAM sobre el territorio nacional."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-panel lg:col-span-3">
          <img
            src={mapImg}
            alt="Mapa topográfico de Colombia con emergencias activas"
            width={1536}
            height={1024}
            className="h-[440px] w-full object-cover opacity-90 sm:h-[560px]"
          />

          {showZones &&
            riskZones.map((z) => (
              <span
                key={z.id}
                title={`${z.label} · Fuente: ${z.source}`}
                className="pointer-events-none absolute rounded-full border border-ai/40 bg-ai/10"
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.size}%`,
                  aspectRatio: "1",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}

          {showTeams &&
            fieldTeams.map((t) => (
              <button
                key={t.id}
                type="button"
                title={`${t.entity} — ${t.staff} efectivos`}
                className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-primary/60 bg-primary/25 text-primary transition-transform hover:scale-110"
                style={{ left: `${t.x}%`, top: `${t.y}%` }}
              >
                <ShieldCheck className="size-4" />
              </button>
            ))}

          {visible.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelected(e)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${e.x}%`, top: `${e.y}%` }}
              aria-label={`Ver detalle de ${e.name}`}
            >
              <span className="relative flex items-center justify-center">
                <span
                  className={cn(
                    "absolute size-4 rounded-full animate-ping-slow",
                    severityDot[e.severity],
                  )}
                />
                <span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full border-2 border-background shadow-lg transition-transform hover:scale-115",
                    severityDot[e.severity],
                  )}
                >
                  <MapPin className="size-4 text-background" />
                </span>
              </span>
            </button>
          ))}

          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px]">
            {severityFilters.map((s) => (
              <span
                key={s.key}
                className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1"
              >
                <span className={cn("size-2 rounded-full", severityDot[s.key])} />
                {s.label}
              </span>
            ))}
            <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-primary">
              <ShieldCheck className="size-3" /> Entidad en campo
            </span>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Capas y filtros</h3>
            </div>
            <div className="space-y-3">
              {severityFilters.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggle(s.key)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                    active.includes(s.key)
                      ? "border-border bg-surface-strong"
                      : "border-transparent bg-muted/40 text-muted-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", severityDot[s.key])} />
                    Severidad {s.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {emergencies.filter((e) => e.severity === s.key).length}
                  </span>
                </button>
              ))}
              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="teams" className="text-sm font-normal">
                  Entidades desplegadas
                </Label>
                <Switch id="teams" checked={showTeams} onCheckedChange={setShowTeams} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="zones" className="text-sm font-normal">
                  Zonas de riesgo UNGRD
                </Label>
                <Switch id="zones" checked={showZones} onCheckedChange={setShowZones} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold">Emergencias visibles</h3>
            <div className="space-y-2">
              {visible.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelected(e)}
                  className="w-full rounded-lg border border-border bg-surface-strong/60 p-3 text-left transition-colors hover:bg-surface-strong"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{e.name}</p>
                    <span
                      className={cn("mt-1 size-2 shrink-0 rounded-full", severityDot[e.severity])}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.region} · {e.affected.toLocaleString("es-CO")} afectados
                  </p>
                </button>
              ))}
              {visible.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sin emergencias para los filtros activos.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center gap-2">
                  <SeverityBadge severity={selected.severity} />
                  <span className="text-xs text-muted-foreground">{selected.id}</span>
                </div>
                <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.type} · {selected.region}, {selected.department} · Actualizado{" "}
                  {selected.updated}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="rounded-lg border border-border bg-surface-strong/60 p-3">
                  <p className="metric-label mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="size-3" /> Fuente del dato de riesgo
                  </p>
                  <p className="text-muted-foreground">{selected.riskSource}</p>
                </div>

                <div className="rounded-lg border border-ai/30 bg-ai-panel p-3">
                  <p className="metric-label mb-2 flex items-center gap-1.5 text-ai">
                    <Brain className="size-3" /> Necesidades primarias detectadas por IA
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.aiNeeds.map((n) => (
                      <span
                        key={n}
                        className="rounded-full border border-ai/40 px-2 py-0.5 text-xs text-ai"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="metric-label mb-2 flex items-center gap-1.5">
                    <Users className="size-3" /> Equipos de respuesta activos
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    {selected.teams.map((t) => (
                      <li key={t} className="flex items-center gap-2">
                        <ShieldCheck className="size-3.5 text-primary" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="metric-label">Población afectada</span>
                  <span className="font-display text-lg font-semibold text-critical">
                    {selected.affected.toLocaleString("es-CO")}
                  </span>
                </div>

                <Button className="w-full" onClick={() => setSelected(null)}>
                  Cerrar detalle
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
