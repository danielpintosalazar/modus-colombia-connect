import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ModusHeader, roles, type RoleKey } from "@/components/modus/RoleSwitcher";
import { PublicPortal } from "@/components/modus/PublicPortal";
import { PrivateDonorView } from "@/components/modus/PrivateDonorView";
import { GovDonorView } from "@/components/modus/GovDonorView";
import { ResponseEntityView } from "@/components/modus/ResponseEntityView";
import { ReportEmergencyDialog } from "@/components/modus/ReportEmergencyDialog";

const title = "Modus — Plataforma Integral de Atención de Desastres en Colombia";
const description =
  "Modus coordina la atención de desastres en Colombia: mapa de emergencias en tiempo real, priorización con IA, trazabilidad de donaciones y gestión operativa de entidades de respuesta.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [role, setRole] = useState<RoleKey>("publico");
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <ModusHeader role={role} onRoleChange={setRole} onReport={() => setReportOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div key={role} className="animate-rise">
          {role === "publico" ? <PublicPortal onReport={() => setReportOpen(true)} /> : null}
          {role === "privado" ? <PrivateDonorView /> : null}
          {role === "gobierno" ? <GovDonorView /> : null}
          {role === "entidad" ? <ResponseEntityView /> : null}
        </div>
      </main>

      <footer className="border-t border-border bg-surface/50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:px-6">
          <p>
            Modus · Plataforma Integral de Atención de Desastres — Colombia. Datos de riesgo integrados desde UNGRD,
            IDEAM y SGC.
          </p>
          <p>Vista activa: {roles.find((r) => r.key === role)?.label}</p>
        </div>
      </footer>

      <ReportEmergencyDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
