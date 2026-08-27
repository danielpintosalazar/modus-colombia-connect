import { Building2, HeartHandshake, Siren, Smartphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActorCards({
  onReport,
  onBeneficiary,
  onRole,
}: {
  onReport: () => void;
  onBeneficiary: () => void;
  onRole: (r: "entidad" | "privado") => void;
}) {
  return (
    <section id="actores" className="scroll-mt-24">
      <div className="grid gap-5 md:grid-cols-3">
        <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-panel">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold tracking-tight">Damnificados</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Reporta emergencias en tiempo real o regístrate como beneficiario en las zonas de desastre activas para
            recibir asistencia.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full" onClick={onReport}>
              <Siren className="mr-2 size-4" /> Reportar emergencia
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={onBeneficiary}>
              <Smartphone className="mr-2 size-4" /> Registrarme
            </Button>
          </div>
        </article>

        <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-panel">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HeartHandshake className="size-5" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold tracking-tight">Instituciones de Respuesta</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Entidades públicas y privadas con capacidad operativa para reaccionar ante emergencias, desplegar equipos,
            gestionar iniciativas y crear campañas.
          </p>
          <div className="mt-5">
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => onRole("entidad")}>
              Entrar como entidad operativa
            </Button>
          </div>
        </article>

        <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-panel">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold tracking-tight">Donantes</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Empresas del sector privado (RSE) y actores públicos que buscan canalizar recursos y sincronizar esfuerzos
            de alto impacto.
          </p>
          <div className="mt-5">
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => onRole("privado")}>
              Explorar iniciativas RSE
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
