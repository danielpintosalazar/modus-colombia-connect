import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Building2, HeartHandshake, MapPin, Package, ShieldCheck, Siren, Truck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { coverFor } from "@/lib/covers";
import { emergencies } from "@/lib/modus-data";
import { donorsFor, initialsOf } from "@/lib/emergency-actors";
import { AiProgress, SeverityBadge } from "@/components/modus/common";
import { VictimLightView } from "@/components/modus/VictimLightView";

export const Route = createFileRoute("/emergencia/$id")({
  loader: ({ params }) => {
    const emergency = emergencies.find((e) => e.id === params.id);
    if (!emergency) throw notFound();
    return { emergency };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Emergencia no encontrada — Modus" }, { name: "robots", content: "noindex" }] };
    }
    const e = loaderData.emergency;
    const title = `${e.name} — ${e.region}, ${e.department} | Modus`;
    const description = `${e.type} en ${e.region}: ${e.affected.toLocaleString("es-CO")} personas afectadas, necesidades priorizadas por IA y entidades de respuesta desplegadas.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: EmergencyDetail,
});

function EmergencyDetail() {
  const { emergency: e } = Route.useLoaderData();
  const [victimOpen, setVictimOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const donors = donorsFor(e);
  const progress = e.severity === "critical" ? 42 : e.severity === "medium" ? 63 : 78;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" /> Volver al Portal
            </Link>
          </Button>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{e.id}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-4 pt-8 sm:px-6">
        {/* HERO BANNER */}
        <section className="relative overflow-hidden rounded-3xl border border-border shadow-panel">
          <img
            src={coverFor(e.region)}
            alt={`${e.type} en ${e.region}, ${e.department}`}
            width={1600}
            height={900}
            className="h-72 w-full object-cover sm:h-96"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold backdrop-blur">
                <MapPin className="size-3.5 text-primary" /> {e.region}, {e.department}
              </span>
              <SeverityBadge severity={e.severity} className="bg-background/90 backdrop-blur" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-background sm:text-5xl">{e.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-background/80">
              {e.type} · Actualizado {e.updated} · {e.responsible}
            </p>
          </div>
        </section>

        {/* CIFRAS */}
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Cifras clave e impacto logrado</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Package, label: "Ayudas entregadas", value: `${(Math.round(e.affected * 0.42)).toLocaleString("es-CO")} kits` },
              { icon: Truck, label: "Unidades activas", value: `${e.teams.length * 7}` },
              { icon: ShieldCheck, label: "Cobertura de atención", value: `${progress}%` },
              { icon: Users, label: "Familias censadas", value: (Math.round(e.affected / 3.4)).toLocaleString("es-CO") },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <k.icon className="size-4 text-primary" />
                <p className="mt-3 font-display text-2xl font-bold tracking-tight">{k.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
            <AiProgress value={progress} label="Avance de la respuesta validado por IA" />
            <p className="mt-3 text-xs text-muted-foreground">Fuente de riesgo: {e.riskSource}</p>
          </div>
        </section>

        {/* NECESIDADES IA */}
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Necesidades principales detectadas por IA</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {e.aiNeeds.map((n) => (
              <span
                key={n}
                className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary"
              >
                {n}
              </span>
            ))}
          </div>
        </section>

        {/* EQUIPOS */}
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Equipos de respuesta activos</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {e.teams.map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold">
                  {initialsOf(t)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t}</p>
                  <p className="text-xs text-muted-foreground">Desplegado en terreno</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Donantes que financian la respuesta
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {donors.map((d) => (
              <div key={d.sector + d.name} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {d.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.sector === "privado" ? "Sector privado" : "Sector público"} · {d.focus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* POBLACIÓN */}
        <section className="rounded-3xl border border-border bg-surface p-8 text-center sm:p-12">
          <p className="metric-label">Población total afectada</p>
          <p className="mt-3 font-display text-6xl font-bold tracking-tight text-primary sm:text-8xl">
            {e.affected.toLocaleString("es-CO")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">personas en {e.region}, {e.department}</p>
        </section>

        {/* CTAs */}
        <section className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Siren className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold tracking-tight">Reportarme como damnificado</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Registra tu ubicación, tu núcleo familiar y tus necesidades para recibir asistencia y hacer seguimiento a
              la llegada de la ayuda.
            </p>
            <Button className="mt-5 rounded-full" onClick={() => setVictimOpen(true)}>
              Reportarme como damnificado
            </Button>
          </div>
          <div className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HeartHandshake className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold tracking-tight">Quiero apoyar</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Onboarding para empresas y entidades donantes que quieran suscribir recursos o capital directamente a esta
              emergencia.
            </p>
            <Button variant="outline" className="mt-5 rounded-full" onClick={() => setSupportOpen(true)}>
              <Building2 className="mr-2 size-4" /> Quiero apoyar
            </Button>
          </div>
        </section>
      </main>

      <Dialog open={victimOpen} onOpenChange={setVictimOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reportarme como damnificado</DialogTitle>
            <DialogDescription>{e.name} · {e.region}, {e.department}</DialogDescription>
          </DialogHeader>
          <VictimLightView />
        </DialogContent>
      </Dialog>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quiero apoyar esta emergencia</DialogTitle>
            <DialogDescription>
              Suscribe recursos o capital a {e.name}. Un coordinador de Modus valida tu aporte en menos de 24 horas.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              setSupportOpen(false);
              toast.success("Intención de apoyo registrada", {
                description: `Tu aporte fue vinculado a ${e.id} — ${e.region}.`,
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="org">Organización</Label>
              <Input id="org" required placeholder="Ej. Grupo Energía Andina" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Recurso o capital a suscribir</Label>
              <Input id="amount" required placeholder="Ej. $500M COP o 2.000 kits de alimentos" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Detalles del aporte</Label>
              <Textarea id="notes" rows={3} placeholder="Capacidad logística, tiempos de entrega, condiciones…" />
            </div>
            <Button type="submit" className="w-full rounded-full">
              Enviar intención de apoyo
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
