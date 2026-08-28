import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Building2, CalendarRange, Flag, PhoneCall, Warehouse } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  collectionCenters,
  emergencies,
  mobilizedResources,
  stateEntities,
} from "@/lib/modus-data";
import {
  crearCentroAcopio,
  getCentrosAcopio,
  getMetrics,
  getNotificacionesEntidad,
  getOrdenesDespliegue,
  notificarEntidad,
  priorizarRecursos,
  type CentroAcopio,
  type Metrics,
  type NotificacionEntidad,
  type OrdenPriorizada,
} from "@/lib/modus-api";
import { DualSparkbars, KpiCard, SectionHeading, SeverityBadge } from "./common";

const statusTone: Record<string, string> = {
  Disponible: "border-csr/40 bg-csr/15 text-csr",
  Desplegada: "border-primary/40 bg-primary/15 text-primary",
  "En alistamiento": "border-warning/40 bg-warning/15 text-warning",
};

export function GovDonorView() {
  const [department, setDepartment] = useState("todos");
  const [form, setForm] = useState({
    name: "",
    city: "",
    entity: "UNGRD",
    capacity: "",
    validity: "",
  });

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenPriorizada[] | null>(null);
  const [priorizando, setPriorizando] = useState(false);
  const [remoteCentros, setRemoteCentros] = useState<CentroAcopio[] | null>(null);
  const [notificaciones, setNotificaciones] = useState<NotificacionEntidad[]>([]);
  const [notificando, setNotificando] = useState<string | null>(null);
  const [savingCentro, setSavingCentro] = useState(false);

  useEffect(() => {
    void getMetrics("gobierno").then(setMetrics);
    void getOrdenesDespliegue("gobierno").then((o) =>
      setOrdenes(o?.map((x) => ({ ...x, score_urgencia: 0, justificacion: "" })) ?? null),
    );
    void getCentrosAcopio("gobierno").then(setRemoteCentros);
    void getNotificacionesEntidad("gobierno").then((n) => setNotificaciones(n ?? []));
  }, []);

  const notificar = async (entidad: string) => {
    setNotificando(entidad);
    try {
      const res = await notificarEntidad({
        entidad_nombre: entidad,
        motivo: "Asignación como grupo de respuesta inmediata",
      });
      setNotificaciones((prev) => [res, ...prev]);
      toast.success("Participación requerida notificada", {
        description: `${entidad} — notificación ${res.id.slice(0, 8)} en estado "${res.estado}".`,
      });
    } catch {
      toast.error("No se pudo enviar la notificación");
    } finally {
      setNotificando(null);
    }
  };

  const guardarCentro = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!form.name || !form.city) {
      toast.error("Completa el nombre y la ciudad del centro de acopio");
      return;
    }
    setSavingCentro(true);
    try {
      const nuevo = await crearCentroAcopio({
        nombre: form.name,
        ciudad: form.city,
        entidades: [form.entity],
        capacidad: form.capacity || "Por definir",
        vigencia: form.validity || "Vigencia abierta",
      });
      setRemoteCentros((prev) => [nuevo, ...(prev ?? [])]);
      toast.success("Centro de acopio registrado en Firestore", {
        description: `${nuevo.nombre} — ${nuevo.ciudad}`,
      });
      setForm({ name: "", city: "", entity: "UNGRD", capacity: "", validity: "" });
    } catch {
      toast.error("No se pudo registrar el centro de acopio");
    } finally {
      setSavingCentro(false);
    }
  };

  const correrPriorizacion = async () => {
    setPriorizando(true);
    try {
      const res = await priorizarRecursos(
        {
          zonas: [
            "zona-choco",
            "zona-mocoa",
            "zona-guajira",
            "zona-cundinamarca",
            "zona-santander",
          ],
          recursos_disponibles: [
            { recurso: "kits_alimentos", cantidad: 8000 },
            { recurso: "carpas", cantidad: 1500 },
            { recurso: "kits_agua", cantidad: 5000 },
          ],
        },
        "gobierno",
      );
      setOrdenes(res.ordenes);
      toast.success("Priorización generada por IA", {
        description: `${res.ordenes.length} órdenes de despliegue propuestas.`,
      });
    } catch {
      toast.error("No se pudo generar la priorización");
    } finally {
      setPriorizando(false);
    }
  };

  const departments = Array.from(new Set(emergencies.map((e) => e.department)));
  const filtered = emergencies.filter((e) => department === "todos" || e.department === department);

  const donutData = [
    { name: "Público", value: mobilizedResources.reduce((a, r) => a + r.publico, 0) },
    { name: "Privado", value: mobilizedResources.reduce((a, r) => a + r.privado, 0) },
  ];

  const centrosList =
    remoteCentros ??
    collectionCenters.map((c) => ({
      id: c.id,
      nombre: c.name,
      ciudad: c.city,
      entidades: c.entities,
      capacidad: c.capacity,
      vigencia: c.validity,
    }));

  return (
    <div className="space-y-14 pb-20">
      <section>
        <SectionHeading
          eyebrow="Comando regional"
          title="Tablero de prioridades territoriales"
          description="Prioriza emergencias por departamento y compara la movilización de recursos públicos frente a los aportes privados."
          action={
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los departamentos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Emergencias priorizadas"
            value={String(filtered.length)}
            hint="Con priorización IA activa"
            data={[3, 4, 4, 5, 5, 6, 6]}
          />
          <KpiCard
            label="Prioridad nacional"
            value={String(emergencies.filter((e) => e.nationalPriority).length)}
            hint="Declaratoria activa"
            data={[1, 1, 2, 2, 2, 3, 3]}
          />
          <KpiCard
            label="Recursos públicos"
            value="$16.150M"
            trend="+9%"
            hint="COP movilizados"
            data={[6.1, 7.8, 9.4, 11.2, 13.1, 14.8, 16.15]}
            chart="line"
          />
          <KpiCard
            label="Recursos privados"
            value="$15.750M"
            trend="+14%"
            hint="COP movilizados"
            data={[4.2, 6.1, 7.9, 9.8, 11.9, 13.9, 15.75]}
            chart="line"
          />
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="metric-label">Contraste público vs privado</p>
              <h3 className="mt-1 text-sm font-semibold">
                Recursos por tipo de emergencia (millones COP)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {mobilizedResources.map((m) => m.type).join(" · ")}
            </p>
          </div>
          <DualSparkbars
            a={mobilizedResources.map((m) => m.publico)}
            b={mobilizedResources.map((m) => m.privado)}
          />
        </div>

        <div className="grid gap-4 space-y-0 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold">
              Recursos movilizados por tipo de emergencia (millones COP)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mobilizedResources}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="type"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="publico"
                    name="Público"
                    fill="var(--foreground)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="privado"
                    name="Privado"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold">Distribución público vs privado</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                  >
                    <Cell fill="var(--foreground)" />
                    <Cell fill="var(--primary)" />
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      color: "var(--popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filtered.map((e) => (
            <article key={e.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={e.severity} />
                {e.nationalPriority ? (
                  <span className="rounded-full border border-critical/40 bg-critical/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-critical">
                    Prioridad nacional
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-muted-foreground">{e.id}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold">{e.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.department} · {e.type} · {e.affected.toLocaleString("es-CO")} afectados
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Responsable: <span className="text-foreground">{e.responsible}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.success("Contacto iniciado", {
                      description: `Se notificó a ${e.responsible} para coordinación directa.`,
                    })
                  }
                >
                  <PhoneCall className="mr-1.5 size-3.5" /> Contactar Responsable
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    toast.success("Iniciativa declarada de Prioridad Nacional", {
                      description: `${e.name} escala a nivel 3 con activación de recursos extraordinarios.`,
                    })
                  }
                >
                  <Flag className="mr-1.5 size-3.5" /> Declarar Prioridad Nacional
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Déficit por sector (en vivo, Firestore) + priorización con IA */}
      <section>
        <SectionHeading
          eyebrow="En vivo · Firestore + Vertex AI"
          title="Déficit por sector y priorización de recursos"
          description="Población con necesidad frente a lo donado por sector, calculado sobre Firestore. El botón invoca al agente de priorización (Gemini) para repartir recursos entre zonas."
          action={
            <Button onClick={() => void correrPriorizacion()} disabled={priorizando}>
              {priorizando ? "Priorizando…" : "Priorizar recursos con IA"}
            </Button>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold">
              Déficit por sector{metrics ? ` · fuente: ${metrics.fuente}` : ""}
            </h3>
            {metrics === null ? (
              <p className="text-sm text-muted-foreground">Cargando métricas…</p>
            ) : (
              <ul className="space-y-2">
                {metrics.deficitPorSector.map((d) => (
                  <li
                    key={d.sector}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-strong/40 px-3 py-2 text-sm"
                  >
                    <span className="capitalize">{d.sector}</span>
                    <span className="text-muted-foreground">
                      {d.poblacionConNecesidad.toLocaleString("es-CO")} pers. ·{" "}
                      <span className="font-semibold text-foreground">
                        {d.cantidadDonada.toLocaleString("es-CO")}
                      </span>{" "}
                      donado
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold">Órdenes de despliegue propuestas</h3>
            {ordenes === null ? (
              <p className="text-sm text-muted-foreground">
                Sin órdenes todavía. Usa “Priorizar recursos con IA”.
              </p>
            ) : ordenes.length === 0 ? (
              <p className="text-sm text-muted-foreground">El agente no propuso órdenes.</p>
            ) : (
              <ul className="space-y-2">
                {ordenes.map((o, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border bg-surface-strong/40 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {o.recurso} → {o.zona_id}
                      </span>
                      <span className="text-muted-foreground">{Math.round(o.cantidad)}</span>
                    </div>
                    {o.justificacion ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{o.justificacion}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Despacho de entidades"
          title="Catálogo de entidades del Estado"
          description="Asigna entidades gubernamentales y de reacción como grupo de respuesta inmediata a emergencias de alta prioridad."
        />
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {stateEntities.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-strong text-primary">
                <Building2 className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.kind} · {s.region} · {s.available} efectivos disponibles
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                  statusTone[s.status],
                )}
              >
                {s.status}
              </span>
              <Button
                size="sm"
                disabled={notificando === s.name}
                onClick={() => void notificar(s.name)}
              >
                <Bell className="mr-1.5 size-3.5" />
                {notificando === s.name ? "Enviando…" : "Notificar Participación Requerida"}
              </Button>
            </div>
          ))}
        </div>

        {notificaciones.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
            <p className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notificaciones emitidas (Firestore)
            </p>
            {notificaciones.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between border-b border-border px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="font-medium">{n.entidad_nombre}</span>
                <span className="text-xs text-muted-foreground">{n.motivo}</span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                  {n.estado}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <SectionHeading
          eyebrow="Logística"
          title="Centros de acopio"
          description="Registra puntos de recolección, entidades presentes, capacidad de almacenamiento y vigencia."
        />
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <form
            className="space-y-4 rounded-2xl border border-border bg-surface p-5"
            onSubmit={(ev) => void guardarCentro(ev)}
          >
            <div className="space-y-2">
              <Label htmlFor="ca-name">Nombre del punto</Label>
              <Input
                id="ca-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Coliseo Municipal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-city">Ciudad / municipio</Label>
              <Input
                id="ca-city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Quibdó, Chocó"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-entity">Entidad estatal presente</Label>
              <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v })}>
                <SelectTrigger id="ca-entity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stateEntities.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-cap">Capacidad de almacenamiento</Label>
              <Input
                id="ca-cap"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="1.500 m³"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-val">Vigencia</Label>
              <Input
                id="ca-val"
                value={form.validity}
                onChange={(e) => setForm({ ...form, validity: e.target.value })}
                placeholder="01 sep — 30 nov 2026"
              />
            </div>
            <Button type="submit" className="w-full" disabled={savingCentro}>
              <Warehouse className="mr-2 size-4" />
              {savingCentro ? "Registrando…" : "Asignar centro de acopio"}
            </Button>
          </form>

          <div className="space-y-3">
            {centrosList.map((c) => (
              <div
                key={c.id}
                className="animate-rise rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{c.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{c.ciudad}</p>
                  </div>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {c.capacidad}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <CalendarRange className="size-3.5" /> {c.vigencia}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.entidades.map((e) => (
                    <span
                      key={e}
                      className="rounded-full border border-border bg-surface-strong px-2 py-0.5 text-xs"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
