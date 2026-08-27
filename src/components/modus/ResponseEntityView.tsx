import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Brain,
  CheckCircle2,
  CloudRain,
  Link2,
  Radar,
  Rocket,
  Satellite,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { needs, regions, riskAlerts, type Need } from "@/lib/modus-data";
import { SectionHeading, SeverityBadge, StatCard, severityChip } from "./common";

const domains = ["Alimentos", "Vivienda", "Salud", "Agua"] as const;

const sourceIcon: Record<string, typeof Radar> = {
  UNGRD: Radar,
  IDEAM: CloudRain,
  "Satélite / CNN": Satellite,
  Dron: Activity,
  SGC: Activity,
};

export function ResponseEntityView() {
  const [domain, setDomain] = useState<string>("todos");
  const [linked, setLinked] = useState<string[]>([]);

  const filtered = needs.filter((n) => domain === "todos" || n.domain === domain);

  const link = (n: Need) => {
    setLinked((p) => (p.includes(n.id) ? p : [...p, n.id]));
    toast.success("Vinculación registrada", {
      description: `Tu entidad quedó vinculada a: ${n.title}`,
    });
  };

  return (
    <div className="space-y-14 pb-20">
      <section>
        <SectionHeading
          eyebrow="Espacio operativo"
          title="Diagnóstico IA y feeds de riesgo"
          description="Alertas automáticas provenientes de sistemas de datos abiertos (UNGRD, IDEAM, SGC) y análisis CNN de imágenes satelitales y de dron."
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Alertas 24 h" value="27" tone="critical" hint="8 críticas sin atender" />
          <StatCard label="Necesidades abiertas" value={String(needs.length)} tone="ai" />
          <StatCard label="Vinculaciones activas" value={String(linked.length + 6)} tone="csr" />
          <StatCard label="Confianza media del modelo" value="94%" hint="Validación cruzada con campo" />
        </div>
        <div className="space-y-3">
          {riskAlerts.map((a) => {
            const Icon = sourceIcon[a.source] ?? Activity;
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-ai/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={a.severity} />
                    <span className="rounded-full border border-ai/40 bg-ai/10 px-2 py-0.5 text-[11px] font-medium text-ai">
                      {a.source}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                </div>
                <div className="text-right">
                  <p className="metric-label">Confianza IA</p>
                  <p className="font-display text-lg font-semibold text-ai">{a.confidence}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Catálogo de necesidades"
          title="Necesidades identificadas y vinculación"
          description="Urgencia calculada por IA a partir de severidad, población afectada y accesibilidad logística."
        />
        <Tabs value={domain} onValueChange={setDomain} className="mb-5">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            {domains.map((d) => (
              <TabsTrigger key={d} value={d}>
                {d}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((n) => (
            <article key={n.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider", severityChip[n.severity])}>
                  {n.domain}
                </span>
                <span className="text-xs text-muted-foreground">
                  {n.region} · {n.id}
                </span>
                {linked.includes(n.id) ? (
                  <span className="ml-auto flex items-center gap-1 text-xs font-medium text-csr">
                    <CheckCircle2 className="size-3.5" /> Vinculada
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug">{n.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{n.detail}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface-strong/50 p-3 text-center">
                <div>
                  <p className="metric-label">Urgencia IA</p>
                  <p className="font-display text-lg font-semibold text-critical">{n.urgency}</p>
                </div>
                <div>
                  <p className="metric-label">Población</p>
                  <p className="font-display text-lg font-semibold">{n.people.toLocaleString("es-CO")}</p>
                </div>
                <div>
                  <p className="metric-label">Entidades</p>
                  <p className="font-display text-lg font-semibold text-primary">
                    {n.linkedEntities + (linked.includes(n.id) ? 1 : 0)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Accesibilidad: {n.accessibility}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" className="flex-1" onClick={() => link(n)} disabled={linked.includes(n.id)}>
                  <Link2 className="mr-1.5 size-3.5" />
                  {linked.includes(n.id) ? "Ya vinculada" : "Vincularse a esta Necesidad"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.success("Suministros reportados", {
                      description: `Entrega registrada para ${n.id} con evidencia georreferenciada.`,
                    })
                  }
                >
                  Reportar Suministros Entregados
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-border bg-surface p-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Avance de campo registrado", {
              description: "Evidencia T1 enviada al motor de validación por visión computacional.",
            });
          }}
        >
          <div>
            <p className="metric-label mb-1 flex items-center gap-1.5">
              <Upload className="size-3" /> Reporte de campo
            </p>
            <h3 className="text-lg font-semibold">Registrar entregas y avance</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fr-need">Necesidad atendida</Label>
            <Select defaultValue={needs[0]?.id}>
              <SelectTrigger id="fr-need">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {needs.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.id} — {n.domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fr-qty">Unidades entregadas</Label>
              <Input id="fr-qty" type="number" placeholder="320" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr-progress">Avance reportado (%)</Label>
              <Input id="fr-progress" type="number" max={100} placeholder="45" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fr-notes">Notas de terreno</Label>
            <Textarea id="fr-notes" rows={3} placeholder="Condiciones de acceso, novedades, población atendida…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fr-evidence">Evidencia post-intervención (T1)</Label>
            <Input id="fr-evidence" type="file" accept="image/*" />
          </div>
          <Button type="submit" className="w-full">
            Enviar reporte de avance
          </Button>
        </form>

        <form
          className="space-y-4 rounded-2xl border border-csr/30 bg-csr-panel p-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Campaña publicada", {
              description: "Tu iniciativa ya es visible para donantes públicos y privados en el marketplace.",
            });
          }}
        >
          <div>
            <p className="metric-label mb-1 flex items-center gap-1.5 text-csr">
              <Rocket className="size-3" /> Asistente de creación
            </p>
            <h3 className="text-lg font-semibold">Crear campaña o iniciativa</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-title">Nombre de la iniciativa</Label>
            <Input id="cp-title" placeholder="Reconstrucción de acueducto comunitario" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cp-zone">Zona objetivo</Label>
              <Select defaultValue={regions[0]}>
                <SelectTrigger id="cp-zone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-goal">Meta de recursos (COP)</Label>
              <Input id="cp-goal" placeholder="1.200.000.000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-desc">Descripción del proyecto</Label>
            <Textarea id="cp-desc" rows={3} placeholder="Alcance, población beneficiaria y cronograma." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-res">Recursos requeridos</Label>
            <Input id="cp-res" placeholder="Tubería, bombas, mano de obra local" />
          </div>
          <div className="rounded-xl border border-ai/30 bg-surface/50 p-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-ai">
              <Brain className="size-3" /> Sugerencia IA
            </span>
            Iniciativas de agua en Chocó alcanzan 2,8x de multiplicador social; incluye metas de mantenimiento a 12
            meses para mejorar la conversión de donantes.
          </div>
          <Button type="submit" className="w-full">
            Publicar campaña
          </Button>
        </form>
      </section>
    </div>
  );
}
