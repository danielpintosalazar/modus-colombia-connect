import { useState } from "react";
import { Activity, Award, HeartHandshake, Search, Siren, Smartphone, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { coverFor } from "@/lib/covers";
import { donors, emergencies, initiatives, regions, type Initiative } from "@/lib/modus-data";
import { ActorAvatars, AiProgress, KpiCard, SectionHeading } from "./common";
import { ActorCards } from "./ActorCards";
import { EmergencyCarousel } from "./EmergencyCarousel";
import { EmergencyMap } from "./EmergencyMap";
import { InitiativeDetailDialog } from "./InitiativeDetailDialog";
import { VictimLightView } from "./VictimLightView";
import type { RoleKey } from "./RoleSwitcher";

export function PublicPortal({ onReport, onRoleChange }: { onReport: () => void; onRoleChange: (r: RoleKey) => void }) {
  const [region, setRegion] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Initiative | null>(null);
  const [victimView, setVictimView] = useState(false);


  const q = query.trim().toLowerCase();
  const filtered = initiatives.filter(
    (i) =>
      (region === "todas" || i.region === region) &&
      (q === "" || i.title.toLowerCase().includes(q) || i.region.toLowerCase().includes(q)),
  );
  const totalAffected = emergencies.reduce((a, e) => a + e.affected, 0);

  return (
    <div className="space-y-20 pb-20">
      {/* HERO */}
      <section className="pt-6 text-center sm:pt-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Activity className="size-3.5 text-primary" /> {emergencies.length} emergencias activas en Colombia
        </span>
        <h1 className="mx-auto mt-6 font-display text-6xl font-bold tracking-tight sm:text-8xl">Modus</h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          Tú también puedes ayudar. Coordinación, asignación de recursos y seguimiento en tiempo real de la atención
          de desastres en Colombia.
        </p>

        <div className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-3xl border border-border bg-card p-2 shadow-panel sm:flex-row sm:items-center sm:rounded-full">
          <div className="flex min-w-0 flex-1 items-center gap-2 pl-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca una región, emergencia o iniciativa"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button size="lg" className="rounded-full" onClick={() => setVictimView(true)}>
            Buscar ayuda
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button variant="destructive" className="rounded-full" onClick={onReport}>
            <Siren className="mr-2 size-4" /> Reportar Emergencia
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setVictimView(true)}>
            <Smartphone className="mr-2 size-4" /> Registrarse como beneficiario
          </Button>
        </div>
      </section>

      <ActorCards
        onReport={onReport}
        onBeneficiary={() => setVictimView(true)}
        onRole={(r) => onRoleChange(r)}
      />



      {/* ESTADÍSTICAS */}
      <section id="estadisticas" className="scroll-mt-24">
        <SectionHeading
          eyebrow="Cifras globales"
          title="Estadísticas del sistema"
          description="Consolidado nacional de afectación, recursos y capacidad operativa desplegada."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Personas afectadas"
            value={totalAffected.toLocaleString("es-CO")}
            hint="Consolidado nacional"
            data={[18, 24, 31, 28, 40, 46, 51]}
            chart="line"
          />
          <KpiCard
            label="Iniciativas activas"
            value={String(initiatives.filter((i) => i.status === "En Proceso").length)}
            hint="Con validación por IA"
            trend="+3"
            data={[2, 3, 3, 4, 4, 5, 6]}
          />
          <KpiCard
            label="Recursos movilizados"
            value="$32.400M"
            hint="Público + privado (COP)"
            trend="+12%"
            data={[12, 16, 19, 22, 26, 29, 32]}
            chart="line"
          />
          <KpiCard label="Entidades desplegadas" value="18" hint="UNGRD, Defensa Civil, Cruz Roja y más" data={[8, 10, 11, 13, 15, 16, 18]} />
        </div>
      </section>

      <EmergencyMap />

      {/* EMERGENCIAS */}
      <section id="emergencias" className="scroll-mt-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Emergencias activas</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Cada emergencia integra fuentes oficiales de riesgo, necesidades detectadas por IA, las entidades que operan
          en terreno y los donantes que financian la respuesta.
        </p>
        <div className="mt-8">
          <EmergencyCarousel />
        </div>
      </section>


      {/* VISTA DAMNIFICADO */}
      <section id="lightweight" className="scroll-mt-24">
        <SectionHeading
          eyebrow="Vista ultraligera"
          title="Modus para damnificados"
          description="Versión optimizada para conexiones débiles: reporta tu ubicación, tu núcleo familiar y tus necesidades en menos de 30 segundos."
          action={
            <Button variant={victimView ? "default" : "outline"} onClick={() => setVictimView((v) => !v)}>
              <Smartphone className="mr-2 size-4" />
              {victimView ? "Ocultar vista damnificado" : "Abrir vista damnificado"}
            </Button>
          }
        />
        {victimView ? (
          <div className="animate-rise">
            <VictimLightView />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-input bg-surface/60 p-10 text-center text-sm text-muted-foreground">
            Activa la vista ultraligera para simular la experiencia móvil del damnificado.
          </div>
        )}
      </section>

      {/* DONANTES */}
      <section id="donantes" className="scroll-mt-24">
        <SectionHeading
          eyebrow="Transparencia"
          title="Top 10 donantes"
          description="Ranking de aportes verificados a iniciativas de atención y recuperación."
        />
        <Tabs defaultValue="privado">
          <TabsList>
            <TabsTrigger value="privado">Sector Privado</TabsTrigger>
            <TabsTrigger value="publico">Sector Público</TabsTrigger>
          </TabsList>
          {(["privado", "publico"] as const).map((sector) => (
            <TabsContent key={sector} value={sector} className="pt-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {donors
                  .filter((d) => d.sector === sector)
                  .map((d) => (
                    <div
                      key={sector + d.rank}
                      className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 transition-colors hover:bg-surface"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold",
                          d.rank <= 3 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {d.rank}
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold">
                        {d.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.focus}</p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-semibold text-primary">{d.amount}</p>
                        <p className="text-xs text-muted-foreground">aportado</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Award className="size-3.5 text-primary" />
                        {d.projects} proyectos
                      </div>
                    </div>
                  ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="size-3.5 text-primary" /> Proyectos verificados con evidencia de campo y validación
                automática de avance.
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* INICIATIVAS */}
      <section id="iniciativas" className="scroll-mt-24">
        <SectionHeading
          eyebrow="Catálogo público"
          title="Iniciativas y reportes de ejecución"
          description="Consulta el avance de cada intervención por región, con progreso validado por inteligencia artificial."
          action={
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filtrar por región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las regiones</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <article
              key={i.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-panel"
            >
              <div className="relative">
                <img
                  src={coverFor(i.region)}
                  alt={`Intervención en ${i.region}`}
                  width={1024}
                  height={640}
                  loading="lazy"
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                  {i.region}
                </span>
                <span
                  className={cn(
                    "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                    i.status === "Concluido"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/90 text-foreground backdrop-blur",
                  )}
                >
                  {i.status}
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-3 pt-8">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/40">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${i.progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-background">
                    {i.progress}% validado por IA
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-semibold leading-snug">{i.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Entidad líder: {i.entity}</p>
                <div className="mt-4">
                  <AiProgress value={i.progress} />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <ActorAvatars actors={i.actors} max={3} />
                  <span className="text-xs text-muted-foreground">
                    {i.population.toLocaleString("es-CO")} personas
                  </span>
                </div>
                <Button variant="outline" className="mt-4 w-full rounded-full" onClick={() => setDetail(i)}>
                  <HeartHandshake className="mr-2 size-4" /> Ver Reporte de Impacto
                </Button>
              </div>
            </article>
          ))}
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay iniciativas para tu búsqueda.</p>
          ) : null}
        </div>
      </section>

      <InitiativeDetailDialog initiative={detail} onOpenChange={(o) => !o && setDetail(null)} />

      <Dialog open={!!emergency} onOpenChange={(o) => !o && setEmergency(null)}>
        <DialogContent className="max-w-lg">
          {emergency ? (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center gap-2">
                  <SeverityBadge severity={emergency.severity} />
                  <span className="text-xs text-muted-foreground">{emergency.id}</span>
                </div>
                <DialogTitle className="text-xl">{emergency.name}</DialogTitle>
                <DialogDescription>
                  {emergency.type} · {emergency.region}, {emergency.department} · Actualizado {emergency.updated}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <img
                  src={coverFor(emergency.region)}
                  alt={`${emergency.type} en ${emergency.region}`}
                  width={1024}
                  height={640}
                  loading="lazy"
                  className="h-44 w-full rounded-xl object-cover"
                />
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="metric-label mb-1">Fuente del dato de riesgo</p>
                  <p className="text-muted-foreground">{emergency.riskSource}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="metric-label mb-2">Necesidades detectadas por IA</p>
                  <div className="flex flex-wrap gap-1.5">
                    {emergency.aiNeeds.map((n) => (
                      <span key={n} className="rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="metric-label mb-2">Entidades de respuesta activas</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {emergency.teams.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full" onClick={() => setEmergency(null)}>
                  Cerrar detalle
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
