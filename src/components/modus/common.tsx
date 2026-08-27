import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/modus-data";
import { severityLabel } from "@/lib/modus-data";

export const severityDot: Record<Severity, string> = {
  critical: "bg-critical",
  medium: "bg-warning",
  low: "bg-low",
};

export const severityChip: Record<Severity, string> = {
  critical: "bg-critical/15 text-critical border-critical/40",
  medium: "bg-warning/15 text-warning border-warning/40",
  low: "bg-low/15 text-low border-low/40",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        severityChip[severity],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", severityDot[severity])} />
      {severityLabel[severity]}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="metric-label mb-1.5">{eyebrow}</p> : null}
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "csr" | "ai" | "critical";
  icon?: ReactNode;
}) {
  const tones = {
    default: "border-border bg-surface",
    csr: "border-csr/30 bg-csr-panel",
    ai: "border-ai/30 bg-ai-panel",
    critical: "border-critical/30 bg-critical-panel",
  } as const;
  const valueTone = {
    default: "text-foreground",
    csr: "text-csr",
    ai: "text-ai",
    critical: "text-critical",
  } as const;

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm transition-colors", tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <p className="metric-label">{label}</p>
        {icon ? <span className={cn("shrink-0", valueTone[tone])}>{icon}</span> : null}
      </div>
      <p className={cn("mt-3 font-display text-2xl font-semibold sm:text-3xl", valueTone[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ActorAvatars({ actors, max = 4 }: { actors: string[]; max?: number }) {
  const shown = actors.slice(0, max);
  const rest = actors.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <span
          key={a + i}
          className="-ml-2 flex size-8 items-center justify-center rounded-full border border-border bg-surface-strong text-[10px] font-bold text-foreground first:ml-0"
        >
          {a}
        </span>
      ))}
      {rest > 0 ? (
        <span className="-ml-2 flex size-8 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

export function AiProgress({ value, label = "Avance validado por IA" }: { value: number; label?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-primary">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function Sparkbars({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className={cn("flex h-10 items-end gap-1", className)}>
      {data.map((v, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 rounded-sm transition-all",
            i === data.length - 1 ? "bg-primary" : "bg-primary/30",
          )}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / span) * 26 - 2}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-10 w-full", className)} aria-hidden>
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  trend,
  chart = "bars",
  data,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  chart?: "bars" | "line";
  data: number[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="metric-label">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-display text-2xl font-semibold sm:text-3xl">{value}</p>
        {trend ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{trend}</span>
        ) : null}
      </div>
      <div className="mt-3">
        {chart === "line" ? <Sparkline data={data} /> : <Sparkbars data={data} />}
      </div>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function DualSparkbars({
  a,
  b,
  labelA = "Público",
  labelB = "Privado",
}: {
  a: number[];
  b: number[];
  labelA?: string;
  labelB?: string;
}) {
  const max = Math.max(...a, ...b, 1);
  return (
    <div>
      <div className="flex h-12 items-end gap-1.5">
        {a.map((v, i) => (
          <span key={i} className="flex flex-1 items-end gap-0.5">
            <span className="flex-1 rounded-sm bg-foreground/80" style={{ height: `${(v / max) * 48}px` }} />
            <span className="flex-1 rounded-sm bg-primary" style={{ height: `${((b[i] ?? 0) / max) * 48}px` }} />
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-foreground/80" /> {labelA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-primary" /> {labelB}
        </span>
      </div>
    </div>
  );
}


