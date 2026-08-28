import { useState } from "react";
import {
  Building2,
  Check,
  HeartHandshake,
  Landmark,
  LogIn,
  LogOut,
  Siren,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { LoginDialog } from "./LoginDialog";

export type RoleKey = "publico" | "privado" | "gobierno" | "entidad";

export const roles: {
  key: RoleKey;
  label: string;
  short: string;
  icon: typeof Users;
  desc: string;
}[] = [
  {
    key: "publico",
    label: "Portal Público / Damnificado",
    short: "Público",
    icon: Users,
    desc: "Reporta, consulta y solicita ayuda",
  },
  {
    key: "privado",
    label: "Donante Sector Privado (RSE)",
    short: "Privado",
    icon: Building2,
    desc: "Invierte y mide impacto RSE",
  },
  {
    key: "gobierno",
    label: "Donante Sector Público / Gobierno",
    short: "Gobierno",
    icon: Landmark,
    desc: "Prioriza y despacha recursos",
  },
  {
    key: "entidad",
    label: "Entidad de Respuesta / Operativa",
    short: "Respuesta",
    icon: HeartHandshake,
    desc: "Opera en terreno y reporta avance",
  },
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
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const auth = useAuth();
  const current = roles.find((r) => r.key === role) ?? roles[0]!;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
            <Siren className="size-4" />
          </span>
          <div className="leading-none">
            <p className="font-display text-lg font-bold tracking-tight">Modus</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Atención de desastres · Colombia
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Button
            variant="destructive"
            className="animate-pulse-ring rounded-full"
            onClick={onReport}
          >
            <Siren className="mr-2 size-4" />
            <span className="hidden sm:inline">Reportar Emergencia</span>
            <span className="sm:hidden">Reportar</span>
          </Button>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Cambiar rol de usuario"
                className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-primary/60 hover:bg-surface-strong"
              >
                <UserRound className="size-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-2">
              {auth.enabled ? (
                <div className="mb-2 rounded-xl border border-border bg-surface/60 p-3">
                  {auth.status === "signed-in" ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="metric-label">Sesión</p>
                        <p className="truncate text-sm font-semibold">{auth.email}</p>
                        {auth.role ? (
                          <p className="text-xs text-muted-foreground">Rol: {auth.role}</p>
                        ) : null}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => void auth.signOutUser()}>
                        <LogOut className="mr-1.5 size-3.5" /> Salir
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setOpen(false);
                        setLoginOpen(true);
                      }}
                    >
                      <LogIn className="mr-1.5 size-3.5" /> Iniciar sesión (Firebase)
                    </Button>
                  )}
                </div>
              ) : null}

              <div className="px-2 pb-2 pt-1">
                <p className="metric-label">Vista activa</p>
                <p className="text-sm font-semibold">{current.label}</p>
              </div>
              <div className="space-y-1">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const activeRole = role === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        onRoleChange(r.key);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        activeRole ? "bg-primary/10 text-foreground" : "hover:bg-surface-strong",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          activeRole ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{r.label}</span>
                        <span className="block text-xs text-muted-foreground">{r.desc}</span>
                      </span>
                      {activeRole ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
