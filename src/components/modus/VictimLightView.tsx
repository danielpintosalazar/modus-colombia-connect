import { useState } from "react";
import { toast } from "sonner";
import { Clock, Droplets, HeartPulse, Home, MapPinned, Truck, Utensils, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const needOptions = [
  { key: "Alimentos", icon: Utensils },
  { key: "Albergue", icon: Home },
  { key: "Médica", icon: HeartPulse },
  { key: "Agua", icon: Droplets },
];

export function VictimLightView() {
  const [selected, setSelected] = useState<string[]>(["Alimentos", "Agua"]);
  const [members, setMembers] = useState("4");
  const [registered, setRegistered] = useState(false);

  const toggle = (k: string) =>
    setSelected((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="metric-label">Modus Ultraligera</p>
          <h3 className="text-lg font-semibold">Necesito ayuda</h3>
        </div>
        <span className="rounded-full border border-csr/40 bg-csr/10 px-2 py-0.5 text-[10px] font-semibold text-csr">
          40 KB
        </span>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-surface-strong/60 p-3 text-xs">
        <MapPinned className="size-4 shrink-0 text-primary" />
        <span className="text-muted-foreground">
          Ubicación capturada: <span className="text-foreground">1.1478, -76.6483</span> — Mocoa, Putumayo
        </span>
      </div>

      <div className="mb-4 space-y-2">
        <Label htmlFor="members" className="text-xs">
          Integrantes del núcleo familiar
        </Label>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <Input
            id="members"
            type="number"
            min={1}
            value={members}
            onChange={(e) => setMembers(e.target.value)}
          />
        </div>
      </div>

      <p className="metric-label mb-2">Necesidades principales</p>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {needOptions.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors",
              selected.includes(key)
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-surface-strong/40 text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {key}
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={() => {
          setRegistered(true);
          toast.success("Solicitud registrada", {
            description: `Núcleo de ${members} personas · ${selected.join(", ")} · Postulación como beneficiario enviada.`,
          });
        }}
      >
        Postularme como beneficiario
      </Button>

      <div className="mt-4 rounded-xl border border-ai/30 bg-ai-panel p-4">
        <p className="metric-label mb-2 flex items-center gap-1.5 text-ai">
          <Truck className="size-3" /> Seguimiento de logística
        </p>
        {registered ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-ai" />
              <span>
                Llegada estimada de ayuda: <span className="font-semibold text-ai">4 h 20 min</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Convoy DC-114 (Defensa Civil) salió del Centro de Acopio Coliseo Municipal Mocoa con 320 kits.
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Registra tu solicitud para ver el tiempo estimado de llegada de la ayuda.
          </p>
        )}
      </div>
    </div>
  );
}
