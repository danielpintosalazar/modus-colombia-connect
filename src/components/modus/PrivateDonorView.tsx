import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Brain, Check, Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { initiatives, investmentTypes, regions, type Initiative } from "@/lib/modus-data";
import { ActorAvatars, AiProgress, KpiCard, SectionHeading } from "./common";
import { InitiativeDetailDialog } from "./InitiativeDetailDialog";

const aiTargets = [
  { sector: "Alimentos", reason: "Déficit de 6.400 kits en Chocó", urgency: "Crítico" },
  { sector: "Salud", reason: "Brigadas insuficientes en Mocoa", urgency: "Alto" },
  { sector: "Construcción", reason: "420 viviendas pendientes de reposición", urgency: "Alto" },
  { sector: "Resiliencia", reason: "Obras de mitigación sin financiar", urgency: "Medio" },
];

const matchSteps = ["Consultando prioridad...", "Viendo zonas de referencia...", "Encontrando match..."];

export function PrivateDonorView() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("todas");
  const [type, setType] = useState("todos");
  const [minProgress, setMinProgress] = useState([0]);
  const [detail, setDetail] = useState<Initiative | null>(null);
  const [matching, setMatching] = useState(false);
  const [step, setStep] = useState(0);
  const [matched, setMatched] = useState<Initiative[]>([]);

  function runMatch() {
    setMatched([]);
    setStep(0);
    setMatching(true);
    const timers = [
      setTimeout(() => setStep(1), 1100),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => {
        setMatching(false);
        setMatched(initiatives.slice(0, 3));
        toast.success("Match completado", {
          description: "3 iniciativas alineadas con tu estrategia RSE fueron priorizadas.",
        });
      }, 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }

  const results = useMemo(
    () =>
      initiatives.filter(
        (i) =>
          (area === "todas" || i.region === area) &&
          (type === "todos" || i.investmentType === type) &&
          i.progress >= (minProgress[0] ?? 0) &&
          (i.title.toLowerCase().includes(query.toLowerCase()) ||
            i.description.toLowerCase().includes(query.toLowerCase())),
      ),
    [area, type, minProgress, query],
  );


  return (
    <div className="space-y-14 pb-20">
      <section className="rounded-3xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="size-5" />
            </span>
            <div>
              <p className="metric-label text-primary">Iniciativas recomendadas por IA</p>
              <h3 className="mt-1 text-lg font-semibold">
                Tu portafolio genera mayor impacto marginal en Alimentos y Salud
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                El motor de priorización cruza severidad, población afectada y accesibilidad logística para
                recomendar dónde tu próximo aporte multiplica el impacto.
              </p>
            </div>
          </div>
          <Button onClick={runMatch}>
            <Sparkles className="mr-2 size-4" /> Hacer Match con Iniciativas
          </Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {aiTargets.map((t) => (
            <div key={t.sector} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t.sector}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    t.urgency === "Crítico"
                      ? "bg-primary text-primary-foreground"
                      : t.urgency === "Alto"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.urgency}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t.reason}</p>
            </div>
          ))}
        </div>

        {matched.length > 0 ? (
          <div className="animate-rise mt-5 rounded-2xl border border-primary/30 bg-csr-panel p-5">
            <p className="metric-label mb-3 text-primary">Match encontrado · {matched.length} iniciativas</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {matched.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setDetail(i)}
                  className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/60"
                >
                  <p className="text-sm font-semibold leading-snug">{i.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {i.region} · {i.budget}
                  </p>
                  <div className="mt-3">
                    <AiProgress value={i.progress} label="Avance" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section>
        <SectionHeading
          eyebrow="Responsabilidad Social Empresarial"
          title="Cifras de impacto — Grupo Energía Andina"
          description="Consolidado de tu inversión social con tendencia mensual verificada en campo."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Hectáreas reforestadas" value="1.842 ha" trend="+8%" hint="96.000 árboles nativos" data={[820, 1010, 1180, 1340, 1520, 1690, 1842]} chart="line" />
          <KpiCard label="Familias asistidas" value="7.640" trend="+11%" hint="24.800 kits entregados" data={[3100, 3900, 4600, 5400, 6200, 6980, 7640]} />
          <KpiCard label="Ingresos locales generados" value="$11.400M" trend="+2,4x" hint="640 empleos temporales" data={[3.2, 4.4, 5.6, 7.1, 8.6, 10.1, 11.4]} chart="line" />
          <KpiCard label="Inversión ejecutada 2026" value="$4.820M" trend="87%" hint="14 iniciativas · 6 departamentos" data={[0.6, 1.2, 1.9, 2.6, 3.4, 4.1, 4.82]} />
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
