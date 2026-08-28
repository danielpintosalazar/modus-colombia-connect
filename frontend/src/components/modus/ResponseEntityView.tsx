import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { needs, regions, riskAlerts, type Need } from "@/lib/modus-data";
import {
  actualizarEstadoNecesidad,
  crearAvanceCampo,
  crearIniciativa,
  getNecesidades,
  getPublicInitiatives,
  subirImagenReporte,
  vincularNecesidad,
  type Necesidad,
} from "@/lib/modus-api";
import type { Initiative } from "@/lib/modus-data";
import { SectionHeading, SeverityBadge, StatCard, severityChip } from "./common";
import { EvidenciaAnalisis } from "./EvidenciaAnalisis";

const domains = ["Alimentos", "Vivienda", "Salud", "Agua"] as const;

const regionZona: Record<string, string> = {
  Mocoa: "zona-mocoa",
  Cundinamarca: "zona-cundinamarca",
  Chocó: "zona-choco",
  "La Guajira": "zona-guajira",
  Santander: "zona-santander",
};
const zonaRegion: Record<string, string> = Object.fromEntries(
  Object.entries(regionZona).map(([r, z]) => [z, r]),
);
const sectores = ["alimentos", "vivienda", "salud", "agua", "energia", "transporte"] as const;
const fuenteLabel: Record<Necesidad["fuente"], string> = {
  manual: "Registro manual",
  agente_diagnostico: "Agente de Diagnóstico",
  sistema_riesgo: "Sistema de riesgo",
};

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

  // Necesidades reales de Firestore (D4).
  const [remoteNeeds, setRemoteNeeds] = useState<Necesidad[] | null>(null);
  const [busyNeed, setBusyNeed] = useState<string | null>(null);
  const [cpZone, setCpZone] = useState<string>(regions[0]);
  const [cpSector, setCpSector] = useState<string>("vivienda");

  // Iniciativas reales para el reporte de avance.
  const [inis, setInis] = useState<Initiative[]>([]);
  const [frIniId, setFrIniId] = useState<string>("");
  const [frFile, setFrFile] = useState<File | null>(null);
  const [frBusy, setFrBusy] = useState(false);

  useEffect(() => {
    void getNecesidades("entidad").then(setRemoteNeeds);
    void getPublicInitiatives().then((list) => {
      setInis(list);
      setFrIniId((prev) => prev || list[0]?.id || "");
    });
  }, []);

  const enviarAvance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setFrBusy(true);
    try {
      let evidencia_url: string | null = null;
      if (frFile) {
        const up = await subirImagenReporte(frFile, "entidad");
        evidencia_url = up?.url ?? null;
      }
      await crearAvanceCampo(
        {
          iniciativa_id: frIniId || null,
          unidades_entregadas: Number(data.get("fr-qty")) || 0,
          progreso_pct: Math.min(100, Number(data.get("fr-progress")) || 0),
          notas: String(data.get("fr-notes") || ""),
          evidencia_url,
        },
        "entidad",
      );
      toast.success("Avance de campo registrado", {
        description: evidencia_url
          ? "Evidencia subida a Cloud Storage y avance guardado en Firestore."
          : "Avance guardado en Firestore.",
      });
      e.currentTarget.reset();
      setFrFile(null);
    } catch {
      toast.error("No se pudo registrar el avance");
    } finally {
      setFrBusy(false);
    }
  };

  const filtered = needs.filter((n) => domain === "todos" || n.domain === domain);

  const link = (n: Need) => {
    setLinked((p) => (p.includes(n.id) ? p : [...p, n.id]));
    toast.success("Vinculación registrada", {
      description: `Tu entidad quedó vinculada a: ${n.title}`,
    });
  };

  const vincularReal = async (n: Necesidad) => {
    setBusyNeed(n.id);
    try {
      const updated = await vincularNecesidad(n.id, "entidad");
      setRemoteNeeds((prev) => prev?.map((x) => (x.id === n.id ? updated : x)) ?? prev);
      toast.success("Vinculación registrada", { description: n.tipo_necesidad });
    } catch {
      toast.error("No se pudo vincular la necesidad");
    } finally {
      setBusyNeed(null);
    }
  };

  const cubrirReal = async (n: Necesidad) => {
    setBusyNeed(n.id);
    try {
      const updated = await actualizarEstadoNecesidad(n.id, "cubierta", "entidad");
      setRemoteNeeds((prev) => prev?.map((x) => (x.id === n.id ? updated : x)) ?? prev);
      toast.success("Necesidad marcada como cubierta", { description: n.tipo_necesidad });
    } catch {
      toast.error("No se pudo actualizar la necesidad");
    } finally {
      setBusyNeed(null);
    }
  };

  const publicarCampana = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const data = new FormData(f);
    try {
      await crearIniciativa(
        {
          titulo: String(data.get("cp-title") || "Nueva campaña"),
          descripcion: String(data.get("cp-desc") || "Sin descripción"),
          zona_id: regionZona[cpZone] ?? "zona-mocoa",
          sector: cpSector as (typeof sectores)[number],
          poblacion_impactada: Number(data.get("cp-pop")) || 1000,
          meta: String(data.get("cp-goal") || "Meta por definir"),
          actores: [],
        },
        "entidad",
      );
      toast.success("Campaña publicada", {
        description: "Tu iniciativa ya es visible en el portal público y el catálogo del donante.",
      });
      f.reset();
    } catch {
      toast.error("No se pudo publicar la campaña");
    }
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
          <StatCard
            label="Confianza media del modelo"
            value="94%"
            hint="Validación cruzada con campo"
          />
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

      <EvidenciaAnalisis />

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
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                    severityChip[n.severity],
                  )}
                >
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
                  <p className="font-display text-lg font-semibold">
                    {n.people.toLocaleString("es-CO")}
                  </p>
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
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => link(n)}
                  disabled={linked.includes(n.id)}
                >
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

      {/* Necesidades reales en Firestore (D4) — con trazabilidad de origen */}
      <section>
        <SectionHeading
          eyebrow="En vivo · Firestore"
          title="Necesidades registradas en el sistema"
          description="Objetos `necesidad` creados manualmente, por el Agente de Diagnóstico o por el sistema de identificación de riesgo. Vincúlate o márcalas como cubiertas."
        />
        {remoteNeeds === null ? (
          <p className="text-sm text-muted-foreground">Cargando necesidades…</p>
        ) : remoteNeeds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin necesidades registradas todavía.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {remoteNeeds.map((n) => (
              <article key={n.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-ai/40 bg-ai/10 px-2.5 py-0.5 text-[11px] font-semibold text-ai">
                    {fuenteLabel[n.fuente]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {zonaRegion[n.zona_id] ?? n.zona_id} · {n.id}
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      n.estado === "cubierta" || n.estado === "cerrada"
                        ? "bg-csr/15 text-csr"
                        : n.estado === "vinculada"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {n.estado}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug">{n.tipo_necesidad}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={
                      busyNeed === n.id || n.estado === "vinculada" || n.estado === "cubierta"
                    }
                    onClick={() => void vincularReal(n)}
                  >
                    <Link2 className="mr-1.5 size-3.5" />
                    {n.estado === "vinculada" ? "Ya vinculada" : "Vincularme"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      busyNeed === n.id || n.estado === "cubierta" || n.estado === "cerrada"
                    }
                    onClick={() => void cubrirReal(n)}
                  >
                    Marcar cubierta
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-border bg-surface p-6"
          onSubmit={(e) => void enviarAvance(e)}
        >
          <div>
            <p className="metric-label mb-1 flex items-center gap-1.5">
              <Upload className="size-3" /> Reporte de campo
            </p>
            <h3 className="text-lg font-semibold">Registrar entregas y avance</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fr-ini">Iniciativa atendida</Label>
            <Select value={frIniId} onValueChange={setFrIniId}>
              <SelectTrigger id="fr-ini">
                <SelectValue placeholder="Selecciona una iniciativa" />
              </SelectTrigger>
              <SelectContent>
                {inis.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.title} — {i.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fr-qty">Unidades entregadas</Label>
              <Input id="fr-qty" name="fr-qty" type="number" min={0} placeholder="320" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fr-progress">Avance reportado (%)</Label>
              <Input
                id="fr-progress"
                name="fr-progress"
                type="number"
                min={0}
                max={100}
                placeholder="45"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fr-notes">Notas de terreno</Label>
            <Textarea
              id="fr-notes"
              name="fr-notes"
              rows={3}
              placeholder="Condiciones de acceso, novedades, población atendida…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fr-evidence">Evidencia post-intervención (T1)</Label>
            <Input
              id="fr-evidence"
              type="file"
              accept="image/*"
              onChange={(e) => setFrFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={frBusy || !frIniId}>
            {frBusy ? "Enviando…" : "Enviar reporte de avance"}
          </Button>
        </form>

        <form
          className="space-y-4 rounded-2xl border border-csr/30 bg-csr-panel p-6"
          onSubmit={(e) => void publicarCampana(e)}
        >
          <div>
            <p className="metric-label mb-1 flex items-center gap-1.5 text-csr">
              <Rocket className="size-3" /> Asistente de creación
            </p>
            <h3 className="text-lg font-semibold">Crear campaña o iniciativa</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-title">Nombre de la iniciativa</Label>
            <Input
              id="cp-title"
              name="cp-title"
              required
              placeholder="Reconstrucción de acueducto comunitario"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cp-zone">Zona objetivo</Label>
              <Select value={cpZone} onValueChange={setCpZone}>
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
              <Label htmlFor="cp-sector">Sector</Label>
              <Select value={cpSector} onValueChange={setCpSector}>
                <SelectTrigger id="cp-sector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectores.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cp-pop">Población impactada</Label>
              <Input id="cp-pop" name="cp-pop" type="number" min={0} placeholder="1200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-goal">Meta</Label>
              <Input id="cp-goal" name="cp-goal" placeholder="10 pozos comunitarios activos" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-desc">Descripción del proyecto</Label>
            <Textarea
              id="cp-desc"
              name="cp-desc"
              rows={3}
              placeholder="Alcance, población beneficiaria y cronograma."
            />
          </div>
          <div className="rounded-xl border border-ai/30 bg-surface/50 p-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-ai">
              <Brain className="size-3" /> Sugerencia IA
            </span>
            Iniciativas de agua en Chocó alcanzan 2,8x de multiplicador social; incluye metas de
            mantenimiento a 12 meses para mejorar la conversión de donantes.
          </div>
          <Button type="submit" className="w-full">
            Publicar campaña
          </Button>
        </form>
      </section>
    </div>
  );
}
