import { useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  CalendarRange,
  Flag,
  PhoneCall,
  Warehouse,
} from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  collectionCenters,
  emergencies,
  mobilizedResources,
  stateEntities,
  type CollectionCenter,
} from "@/lib/modus-data";
import { SectionHeading, SeverityBadge, StatCard } from "./common";

const statusTone: Record<string, string> = {
  Disponible: "border-csr/40 bg-csr/15 text-csr",
  Desplegada: "border-primary/40 bg-primary/15 text-primary",
  "En alistamiento": "border-warning/40 bg-warning/15 text-warning",
};

export function GovDonorView() {
  const [department, setDepartment] = useState("todos");
  const [centers, setCenters] = useState<CollectionCenter[]>(collectionCenters);
  const [form, setForm] = useState({ name: "", city: "", entity: "UNGRD", capacity: "", validity: "" });

  const departments = Array.from(new Set(emergencies.map((e) => e.department)));
  const filtered = emergencies.filter((e) => department === "todos" || e.department === department);

  const donutData = [
    { name: "Público", value: mobilizedResources.reduce((a, r) => a + r.publico, 0) },
    { name: "Privado", value: mobilizedResources.reduce((a, r) => a + r.privado, 0) },
  ];

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
          <StatCard label="Emergencias priorizadas" value={String(filtered.length)} tone="critical" />
          <StatCard label="Prioridad nacional" value={String(emergencies.filter((e) => e.nationalPriority).length)} tone="critical" hint="Declaratoria activa" />
          <StatCard label="Recursos públicos" value="$16.150M" tone="ai" hint="COP movilizados" />
          <StatCard label="Recursos privados" value="$15.750M" tone="csr" hint="COP movilizados" />
        </div>

        <div className="grid gap-4 space-y-0 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold">Recursos movilizados por tipo de emergencia (millones COP)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mobilizedResources}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="type" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="publico" name="Público" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="privado" name="Privado" fill="var(--csr)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold">Distribución público vs privado</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3}>
                    <Cell fill="var(--primary)" />
                    <Cell fill="var(--csr)" />
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
                onClick={() =>
                  toast.success("Participación requerida notificada", {
                    description: `${s.name} fue asignada como grupo de respuesta inmediata.`,
                  })
                }
              >
                <Bell className="mr-1.5 size-3.5" /> Notificar Participación Requerida
              </Button>
            </div>
          ))}
        </div>
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
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!form.name || !form.city) {
                toast.error("Completa el nombre y la ciudad del centro de acopio");
                return;
              }
              setCenters((c) => [
                {
                  id: `CA-${c.length + 1}`,
                  name: form.name,
                  city: form.city,
                  entities: [form.entity],
                  capacity: form.capacity || "Por definir",
                  validity: form.validity || "Vigencia abierta",
                },
                ...c,
              ]);
              toast.success("Centro de acopio asignado", { description: `${form.name} — ${form.city}` });
              setForm({ name: "", city: "", entity: "UNGRD", capacity: "", validity: "" });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="ca-name">Nombre del punto</Label>
              <Input id="ca-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Coliseo Municipal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-city">Ciudad / municipio</Label>
              <Input id="ca-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Quibdó, Chocó" />
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
              <Input id="ca-cap" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="1.500 m³" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-val">Vigencia</Label>
              <Input id="ca-val" value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })} placeholder="01 sep — 30 nov 2026" />
            </div>
            <Button type="submit" className="w-full">
              <Warehouse className="mr-2 size-4" /> Asignar centro de acopio
            </Button>
          </form>

          <div className="space-y-3">
            {centers.map((c) => (
              <div key={c.id} className="animate-rise rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.city}</p>
                  </div>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {c.capacity}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <CalendarRange className="size-3.5" /> {c.validity}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.entities.map((e) => (
                    <span key={e} className="rounded-full border border-border bg-surface-strong px-2 py-0.5 text-xs">
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
