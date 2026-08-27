import { useState } from "react";
import { Activity, Award, HeartHandshake, Search, Siren, Smartphone, Trophy } from "lucide-react";
import heroImg from "@/assets/hero-response.jpg";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { donors, emergencies, initiatives, regions, type Initiative } from "@/lib/modus-data";
import { ActorAvatars, AiProgress, SectionHeading, StatCard } from "./common";
import { EmergencyMap } from "./EmergencyMap";
import { InitiativeDetailDialog } from "./InitiativeDetailDialog";
import { VictimLightView } from "./VictimLightView";

export function PublicPortal({ onReport }: { onReport: () => void }) {
  const [region, setRegion] = useState<string>("todas");
  const [detail, setDetail] = useState<Initiative | null>(null);
  const [victimView, setVictimView] = useState(false);

  const filtered = initiatives.filter((i) => region === "todas" || i.region === region);
  const totalAffected = emergencies.reduce((a, e) => a + e.affected, 0);

  return (
    <div className="space-y-16 pb-20">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-hero">
        <img
          src={heroImg}
          alt="Equipos de la Defensa Civil Colombiana entregando kits humanitarios"
          width={1536}
          height={1024}
          className="absolute inset-0 size-full object-cover opacity-30"
        />
        <div className="relative px-6 py-16 sm:px-12 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-critical/40 bg-critical/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-critical">
            <Activity className="size-3.5" /> {emergencies.length} emergencias activas en Colombia
          </span>
          <h1 className="mt-6 font-display text-6xl font-bold tracking-tight sm:text-8xl">Modus</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Tú también puedes ayudar. Plataforma de coordinación y atención en tiempo real ante desastres en
            Colombia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="destructive" onClick={onReport}>
              <Siren className="mr-2 size-4" /> Reportar Emergencia
            </Button>
            <Button size="lg" variant="outline" onClick={() => setVictimView(true)}>
              <Search className="mr-2 size-4" /> Buscar Ayuda / Registrarse como Beneficiario
            </Button>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Personas afectadas" value={totalAffected.toLocaleString("es-CO")} tone="critical" hint="Consolidado nacional" />
            <StatCard label="Iniciativas activas" value={String(initiatives.filter((i) => i.status === "En Proceso").length)} tone="ai" hint="Con validación por IA" />
            <StatCard label="Recursos movilizados" value="$32.400M" tone="csr" hint="Público + privado (COP)" />
            <StatCard label="Entidades desplegadas" value="18" hint="UNGRD, Defensa Civil, Cruz Roja y más" />
          </div>
        </div>
      </section>

      <EmergencyMap />

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
              <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                {donors
                  .filter((d) => d.sector === sector)
                  .map((d) => (
                    <div
                      key={sector + d.rank}
                      className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 transition-colors hover:bg-surface-strong/60"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold",
                          d.rank <= 3 ? "bg-csr/20 text-csr" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {d.rank}
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-strong text-xs font-bold">
                        {d.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.focus}</p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-semibold text-csr">{d.amount}</p>
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
                <Trophy className="size-3.5 text-csr" /> Proyectos verificados con evidencia de campo y validación
                automática de avance.
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </section>

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <article
              key={i.id}
              className="flex flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/50"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs font-medium">
                  {i.region}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                    i.status === "Concluido"
                      ? "border-csr/40 bg-csr/15 text-csr"
                      : "border-warning/40 bg-warning/15 text-warning",
                  )}
                >
                  {i.status}
                </span>
              </div>
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
              <Button variant="outline" className="mt-4 w-full" onClick={() => setDetail(i)}>
                <HeartHandshake className="mr-2 size-4" /> Ver Reporte de Impacto
              </Button>
            </article>
          ))}
        </div>
      </section>

      <InitiativeDetailDialog initiative={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </div>
  );
}
