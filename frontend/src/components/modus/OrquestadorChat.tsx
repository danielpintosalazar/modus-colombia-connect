import { useState } from "react";
import { Bot, HeartHandshake, Send, Siren, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postChat, type ChatReply } from "@/lib/modus-api";

type Turn = { role: "user" | "assistant"; text: string; acciones?: string[]; datos?: string[] };
type Intent = "damnificado" | "donante";

const sugerencias: { intent: Intent; text: string }[] = [
  {
    intent: "damnificado",
    text: "Se derrumbó parte de mi casa en Mocoa y estamos 5 personas sin agua",
  },
  { intent: "damnificado", text: "Estoy atrapado por una inundación, ¿qué hago?" },
  { intent: "donante", text: "Quiero ayudar con agua potable, ¿a qué zona conviene donar?" },
  { intent: "donante", text: "Tengo 2000 kits de alimentos, ¿dónde tienen más impacto?" },
];

const RE_AYUDA =
  /\b(quiero ayudar|c[oó]mo (puedo )?ayud|ayudar|donar|donaci[oó]n|aportar|contribuir|apoyar|voluntari|patrocin|financiar|rse)\b/;
const RE_AFECTADO =
  /\b(me pas[oó]|nos pas[oó]|mi casa|mi familia|estoy|estamos|atrapad|auxilio|socorro|perd[ií]|perdimos|derrumb|se inund|inundaci[oó]n|terremot|sismo|no tengo|necesito|necesitamos|rescat|damnificad|afectad)\b/;

/** Deduce si quien escribe es un afectado o alguien que quiere ayudar. */
function inferIntent(mensaje: string): Intent {
  const m = mensaje.toLowerCase();
  const ayuda = RE_AYUDA.test(m);
  const afectado = RE_AFECTADO.test(m);
  if (ayuda && !afectado) return "donante";
  if (afectado && !ayuda) return "damnificado";
  // Ambos o ninguno: por prudencia se asume que puede estar en riesgo.
  return afectado ? "damnificado" : ayuda ? "donante" : "damnificado";
}

const roleKeyForIntent: Record<Intent, string> = { damnificado: "publico", donante: "privado" };

export function OrquestadorChat({ roleKey }: { roleKey?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);

  const enviar = async (mensaje: string) => {
    const q = mensaje.trim();
    if (!q || busy) return;

    const intent = inferIntent(q);
    setLastIntent(intent);
    const rk = roleKey ?? roleKeyForIntent[intent];

    setTurns((t) => [...t, { role: "user", text: q }]);
    setInput("");
    setBusy(true);

    let reply: ChatReply | null = null;
    try {
      reply = await postChat(rk, q);
    } catch {
      reply = null;
    }

    setTurns((t) => [
      ...t,
      reply
        ? {
            role: "assistant",
            text: reply.respuesta,
            acciones: reply.acciones_sugeridas,
            datos: reply.datos_usados,
          }
        : {
            role: "assistant",
            text: "No pude consultar al agente ahora mismo. Intenta de nuevo en unos segundos.",
          },
    ]);
    setBusy(false);
  };

  return (
    <div className="rounded-3xl border border-ai/30 bg-ai-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-ai/15 text-ai">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="metric-label text-ai">Agente Orquestador · Gemini</p>
            <p className="text-sm font-semibold">Cuéntale qué pasó o pregúntale cómo ayudar</p>
          </div>
        </div>
        {lastIntent ? (
          <span
            className={
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold " +
              (lastIntent === "damnificado"
                ? "border-critical/40 bg-critical/10 text-critical"
                : "border-primary/40 bg-primary/10 text-primary")
            }
          >
            {lastIntent === "damnificado" ? (
              <>
                <Siren className="size-3" /> Modo afectado
              </>
            ) : (
              <>
                <HeartHandshake className="size-3" /> Modo donante
              </>
            )}
          </span>
        ) : null}
      </div>

      <div className="mb-3 max-h-80 space-y-3 overflow-y-auto">
        {turns.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {sugerencias.map((s) => (
              <button
                key={s.text}
                type="button"
                onClick={() => void enviar(s.text)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs transition-colors " +
                  (s.intent === "damnificado"
                    ? "border-critical/40 text-critical hover:bg-critical/10"
                    : "border-primary/40 text-primary hover:bg-primary/10")
                }
              >
                {s.text}
              </button>
            ))}
          </div>
        ) : null}

        {turns.map((t, i) => (
          <div key={i} className="flex gap-2.5">
            <span
              className={
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full " +
                (t.role === "user" ? "bg-surface-strong text-foreground" : "bg-ai/15 text-ai")
              }
            >
              {t.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-sm">{t.text}</p>
              {t.acciones && t.acciones.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  {t.acciones.map((a) => (
                    <li key={a}>→ {a}</li>
                  ))}
                </ul>
              ) : null}
              {t.datos && t.datos.length > 0 ? (
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  Fuente: {t.datos.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? (
          <p className="pl-8 text-xs text-muted-foreground">El agente está pensando…</p>
        ) : null}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej. 'se inundó mi barrio' o 'quiero donar carpas'…"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
