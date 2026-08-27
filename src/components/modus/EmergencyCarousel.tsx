import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { coverFor } from "@/lib/covers";
import { emergencies } from "@/lib/modus-data";
import { donorsFor, initialsOf } from "@/lib/emergency-actors";
import { ActorAvatars, SeverityBadge } from "./common";

export function EmergencyCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = emergencies.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 5500);
    return () => clearInterval(t);
  }, [paused, total]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-panel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {emergencies.map((e) => (
          <article key={e.id} className="w-full shrink-0 grow-0 basis-full">
            <div className="grid lg:grid-cols-2">
              <div className="relative h-64 lg:h-full lg:min-h-[26rem]">
                <img
                  src={coverFor(e.region)}
                  alt={`${e.type} en ${e.region}, ${e.department}`}
                  width={1024}
                  height={640}
                  loading="lazy"
                  className="size-full object-cover"
                />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <MapPin className="size-3.5 text-primary" /> {e.region}, {e.department}
                </span>
                <span className="absolute right-4 top-4">
                  <SeverityBadge severity={e.severity} className="bg-background/90 backdrop-blur" />
                </span>
              </div>

              <div className="flex flex-col gap-5 p-6 sm:p-9">
                <div>
                  <p className="metric-label mb-2">{e.type}</p>
                  <h3 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{e.name}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {e.riskSource}. Actualizado {e.updated} · Responsable: {e.responsible}.
                  </p>
                </div>

                <div>
                  <p className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                    {e.affected.toLocaleString("es-CO")}
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">Afectados</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="metric-label mb-2">Entidades desplegadas</p>
                    <ActorAvatars actors={e.teams.map(initialsOf)} max={4} />
                  </div>
                  <div>
                    <p className="metric-label mb-2">Donantes que financian</p>
                    <ActorAvatars actors={donorsFor(e).map((d) => d.initials)} max={4} />
                  </div>
                </div>

                <Button asChild size="lg" className="mt-auto w-full rounded-full sm:w-auto">
                  <Link to="/emergencia/$id" params={{ id: e.id }}>
                    Ver detalle de la emergencia
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-background/90 px-3 py-1.5 backdrop-blur lg:left-6 lg:translate-x-0">
        <button
          type="button"
          aria-label="Emergencia anterior"
          onClick={() => setIndex((i) => (i - 1 + total) % total)}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        {emergencies.map((e, i) => (
          <button
            key={e.id}
            type="button"
            aria-label={`Ir a ${e.name}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground",
            )}
          />
        ))}
        <button
          type="button"
          aria-label="Emergencia siguiente"
          onClick={() => setIndex((i) => (i + 1) % total)}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
