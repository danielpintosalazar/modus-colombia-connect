import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const demoAccounts = [
  { email: "damnificado.demo@modus.local", rol: "Damnificado" },
  { email: "donante1.demo@modus.local", rol: "Donante privado" },
  { email: "estado1.demo@modus.local", rol: "Estado / Entidad de respuesta" },
];

export function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      onOpenChange(false);
      setPassword("");
    } catch {
      setError("No se pudo iniciar sesión. Revisa el correo y la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Iniciar sesión en Modus</DialogTitle>
          <DialogDescription>
            El rol se asigna desde Firebase Auth (custom claim).
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Correo</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Contraseña</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error ? <p className="text-sm text-critical">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            <LogIn className="mr-2 size-4" /> {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <div className="rounded-lg border border-dashed border-input bg-surface/60 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold">Cuentas de demo (contraseña: Password123!)</p>
          <ul className="space-y-0.5">
            {demoAccounts.map((a) => (
              <li key={a.email}>
                <span className="font-mono">{a.email}</span> — {a.rol}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
