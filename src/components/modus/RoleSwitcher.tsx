import { Building2, HeartHandshake, Landmark, Siren, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RoleKey = "publico" | "privado" | "gobierno" | "entidad";

export const roles: { key: RoleKey; label: string; short: string; icon: typeof Users; desc: string }[] = [
  { key: "publico", label: "Portal Público / Damnificado", short: "Público", icon: Users, desc: "Reporta, consulta y solicita ayuda" },
  { key: "privado", label: "Donante Sector Privado (RSE)", short: "Privado", icon: Building2, desc: "Invierte y mide impacto RSE" },
  { key: "gobierno", label: "Donante Sector Público / Gobierno", short: "Gobierno", icon: Landmark, desc: "Prioriza y despacha recursos" },
  { key: "entidad", label: "Entidad de Respuesta / Operativa", short: "Respuesta", icon: HeartHandshake, desc: "Opera en terreno y reporta avance" },
];

export function ModusHeader({
  role,
  onRoleChange,
  onReport,
}: {
  role: RoleKey;
  onRoleChange: (r: RoleKey) => void;
  onReport: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Siren className="size-4" />
          </span>
          <div className="leading-none">
            <p className="font-display text-lg font-bold tracking-tight">Modus</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Atención de desastres · Colombia
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          className="ml-auto animate-pulse-ring order-2 rounded-full sm:order-none"
          onClick={onReport}
        >
          <Siren className="mr-2 size-4" /> Reportar Emergencia
        </Button>
      </div>

      <nav className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
        <div className="flex gap-1.5 overflow-x-auto rounded-full border border-border bg-surface p-1.5 shadow-panel">
          {roles.map((r) => {
            const Icon = r.icon;
            const activeRole = role === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => onRoleChange(r.key)}
                className={cn(
                  "flex min-w-fit flex-1 items-center gap-2.5 rounded-full px-4 py-2 text-left transition-all duration-300",
                  activeRole
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-surface-strong hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">
                  <span className="block text-xs font-semibold sm:text-sm">{r.label}</span>
                  <span
                    className={cn(
                      "hidden text-[11px] lg:block",
                      activeRole ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {r.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </header>
  );
}
