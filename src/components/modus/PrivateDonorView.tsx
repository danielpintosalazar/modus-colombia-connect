import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Brain, Coins, Leaf, Search, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { initiatives, investmentTypes, regions, type Initiative } from "@/lib/modus-data";
import { ActorAvatars, AiProgress, SectionHeading, StatCard } from "./common";
import { InitiativeDetailDialog } from "./InitiativeDetailDialog";

const aiTargets = [
  { sector: "Alimentos", reason: "Déficit de 6.400 kits en Chocó", urgency: "Crítico" },
  { sector: "Salud", reason: "Brigadas insuficientes en Mocoa", urgency: "Alto" },
  { sector: "Construcción", reason: "420 viviendas pendientes de reposición", urgency: "Alto" },
  { sector: "Resiliencia", reason: "Obras de mitigación sin financiar", urgency: "Medio" },
];

export function PrivateDonorView() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("todas");
  const [type, setType] = useState("todos");
  const [minProgress, setMinProgress] = useState([0]);
  const [detail, setDetail] = useState<Initiative | null>(null);

  const results = useMemo(
    () =>
      initiatives.filter(
        (i) =>
          (area === "todas" || i.region === area) &&
          (type === "todos" || i.investmentType === type) &&
          i.progress >= minProgress[0] &&
          (i.title.toLowerCase().includes(query.toLowerCase()) ||
            i.description.toLowerCase().includes(query.toLowerCase())),
      ),
    [area, type, minProgress, query],
  );

  return (
    <div className="space-y-14 pb-20">
      <section>
        <SectionHeading
          eyebrow="Responsabilidad Social Empresarial"
          title="Balance de impacto — Grupo Energía Andina"
          description="Consolidado de tu inversión social en los tres ejes de sostenibilidad, con trazabilidad verificada en campo."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-csr/30 bg-csr-panel p-6">
            <div className="mb-4 flex items-center gap-2 text-csr">
              <Leaf className="size-4" />
              <p className="metric-label text-csr">Eje ambiental</p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-display text-3xl font-semibold text-csr">1.842 ha</p>
                <p className="text-xs text-muted-foreground">Hectáreas reforestadas</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold">96.000</p>
                  <p className="text-xs text-muted-foreground">Árboles nativos</p>
                </div>
                <div>
                  <p className="font-semibold">14.200 t</p>
                  <p className="text-xs text-muted-foreground">CO₂ mitigado</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-ai-panel p-6">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Users className="size-4" />
              <p className="metric-label text-primary">Eje social</p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-display text-3xl font-semibold text-primary">7.640</p>
                <p className="text-xs text-muted-foreground">Familias asistidas</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold">24.800</p>
                  <p className="text-xs text-muted-foreground">Kits entregados</p>
                </div>
                <div>
                  <p className="font-semibold">3.120</p>
                  <p className="text-xs text-muted-foreground">Menores atendidos</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-warning/30 bg-critical-panel p-6">
            <div className="mb-4 flex items-center gap-2 text-warning">
              <Coins className="size-4" />
              <p className="metric-label text-warning">Eje económico</p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-display text-3xl font-semibold text-warning">$11.400M</p>
                <p className="text-xs text-muted-foreground">Ingresos locales generados (COP)</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold">640</p>
                  <p className="text-xs text-muted-foreground">Empleos temporales</p>
                </div>
                <div>
                  <p className="font-semibold">2,4x</p>
                  <p className="text-xs text-muted-foreground">Multiplicador social</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Inversión ejecutada 2026" value="$4.820M COP" tone="csr" hint="87% de la meta anual" />
          <StatCard label="Iniciativas apoyadas" value="14" tone="ai" hint="9 en proceso · 5 concluidas" />
          <StatCard label="Cobertura territorial" value="6 departamentos" hint="Putumayo, Chocó, Cundinamarca y más" />
        </div>
      </section>

      <section className="rounded-2xl border border-ai/40 bg-ai-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ai/20 text-ai">
              <Brain className="size-5" />
            </span>
            <div>
              <p className="metric-label text-ai">Recomendación priorizada por IA</p>
              <h3 className="mt-1 text-lg font-semibold">
                Tu portafolio genera mayor impacto marginal en Alimentos y Salud
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                El motor de priorización cruza severidad, población afectada y accesibilidad logística para
                recomendar dónde tu próximo aporte multiplica el impacto.
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              toast.success("Portafolio sugerido generado", {
                description: "3 iniciativas recomendadas fueron añadidas a tu lista de evaluación.",
              })
            }
          >
            <Sparkles className="mr-2 size-4" /> Ver portafolio sugerido
          </Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {aiTargets.map((t) => (
            <div key={t.sector} className="rounded-xl border border-ai/30 bg-surface/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t.sector}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    t.urgency === "Crítico"
                      ? "bg-critical/20 text-critical"
                      : t.urgency === "Alto"
                        ? "bg-warning/20 text-warning"
                        : "bg-low/20 text-low",
                  )}
                >
                  {t.urgency}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Marketplace de iniciativas"
          title="Catálogo de inversión social"
          description="Filtra por zona, avance y tipo de inversión para encontrar la iniciativa alineada con tu estrategia RSE."
        />
        <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-surface p-5 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar iniciativa…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger>
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las áreas</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de inversión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {investmentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="lg:col-span-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="metric-label">Avance mínimo</span>
              <span className="font-semibold text-ai">{minProgress[0]}%</span>
            </div>
            <Slider value={minProgress} onValueChange={setMinProgress} max={100} step={5} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((i) => (
            <article key={i.id} className="flex flex-col rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  {i.area}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug">{i.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {i.investmentType} · {i.budget}
              </p>
              <div className="mt-4">
                <AiProgress value={i.progress} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="metric-label">Población impactada</p>
                  <p className="text-sm font-semibold">{i.population.toLocaleString("es-CO")}</p>
                </div>
                <ActorAvatars actors={i.actors} />
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() =>
                    toast.success("Inversión iniciada", {
                      description: `${i.title} — se generó la orden de aporte con trazabilidad Modus.`,
                    })
                  }
                >
                  Invertir / Donar
                </Button>
                <Button variant="outline" onClick={() => setDetail(i)}>
                  Detalle
                </Button>
              </div>
            </article>
          ))}
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay iniciativas para los filtros seleccionados.</p>
          ) : null}
        </div>
      </section>

      <InitiativeDetailDialog initiative={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </div>
  );
}
