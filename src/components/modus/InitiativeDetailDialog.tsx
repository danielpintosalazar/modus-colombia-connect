import { useState } from "react";
import { toast } from "sonner";
import { Brain, Building2, HandCoins, Package, TrendingUp, Users } from "lucide-react";
import t0 from "@/assets/mocoa-t0.jpg";
import t1 from "@/assets/mocoa-t1.jpg";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Initiative } from "@/lib/modus-data";
import { ActorAvatars, AiProgress } from "./common";

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-border">
        <img src={t1} alt="Estado T1 tras la intervención" width={1024} height={640} loading="lazy" className="block h-56 w-full object-cover sm:h-64" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <img
            src={t0}
            alt="Estado T0 del desastre"
            width={1024}
            height={640}
            loading="lazy"
            className="h-56 w-full object-cover sm:h-64"
            style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }}
          />
        </div>
        <div className="absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${pos}%` }} />
        <span className="absolute left-3 top-3 rounded-full bg-critical/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-critical-foreground">
          T0 · Desastre
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-csr/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-csr-foreground">
          T1 · Validación IA
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Comparador antes y después"
        className="w-full accent-[var(--primary)]"
      />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Brain className="size-3 text-ai" /> Progreso evolutivo validado por visión computacional sobre imágenes
        georreferenciadas.
      </p>
    </div>
  );
}

export function InitiativeDetailDialog({
  initiative,
  onOpenChange,
}: {
  initiative: Initiative | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!initiative} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {initiative ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{initiative.title}</DialogTitle>
              <DialogDescription>
                {initiative.region} · {initiative.investmentType} · Presupuesto {initiative.budget}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <BeforeAfter />

              <AiProgress value={initiative.progress} />

              <p className="text-sm text-muted-foreground">{initiative.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-strong/50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-primary" />
                  <span className="text-muted-foreground">Entidad responsable:</span>
                  <span className="font-medium">{initiative.entity}</span>
                </div>
                <ActorAvatars actors={initiative.actors} />
              </div>

              <div>
                <p className="metric-label mb-3 flex items-center gap-1.5 text-csr">
                  <TrendingUp className="size-3" /> Insights de impacto y ROI social
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-csr/30 bg-csr-panel p-4">
                    <Users className="mb-2 size-4 text-csr" />
                    <p className="font-display text-xl font-semibold text-csr">
                      {initiative.families.toLocaleString("es-CO")}
                    </p>
                    <p className="text-xs text-muted-foreground">Familias alcanzadas</p>
                  </div>
                  <div className="rounded-xl border border-csr/30 bg-csr-panel p-4">
                    <Package className="mb-2 size-4 text-csr" />
                    <p className="font-display text-xl font-semibold text-csr">
                      {initiative.kits.toLocaleString("es-CO")}
                    </p>
                    <p className="text-xs text-muted-foreground">Kits entregados</p>
                  </div>
                  <div className="rounded-xl border border-csr/30 bg-csr-panel p-4">
                    <HandCoins className="mb-2 size-4 text-csr" />
                    <p className="font-display text-sm font-semibold leading-snug text-csr">
                      {initiative.multiplier}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Efecto multiplicador</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    onOpenChange(false);
                    toast.success("Intención de inversión registrada", {
                      description: `${initiative.title} — un asesor de la entidad responsable te contactará.`,
                    });
                  }}
                >
                  Invertir / Donar
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info("Reporte de impacto generado", {
                      description: "Se descargará el PDF con la trazabilidad T0 → T1 de la iniciativa.",
                    })
                  }
                >
                  Descargar reporte
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
