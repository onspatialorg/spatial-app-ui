"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, X, XCircle } from "lucide-react";
import { Blockie } from "@/components/Blockie";
import { shortAddress } from "@/lib/platform/format";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Page structure: a header (plain or on the sky), a KPI row, then cards */
/* ------------------------------------------------------------------ */

export type Accent = "lagoon" | "amber" | "leaf" | "rose";

export interface ReadoutProps {
  label: string;
  value: string;
  hint?: string;
  accent?: Accent;
}

const accentText: Record<Accent, string> = {
  lagoon: "text-lagoon-deep",
  amber: "text-amber-deep",
  leaf: "text-leaf-deep",
  rose: "text-rose-deep",
};

const accentDot: Record<Accent, string> = {
  lagoon: "bg-aqua",
  amber: "bg-amber",
  leaf: "bg-leaf",
  rose: "bg-rose",
};

/** One KPI card. On the sky it turns to frosted glass. */
export function Readout({ label, value, hint, accent, onSky = false }: ReadoutProps & { onSky?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col rounded-[20px] px-5 py-4", onSky ? "glass" : "card")}>
      <div className="flex items-start gap-2">
        <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", accent ? accentDot[accent] : "bg-pale")} aria-hidden="true" />
        <span className="text-[12.5px] font-medium leading-snug text-tide">{label}</span>
      </div>
      <div className={cn("readout mt-2.5 font-display text-[24px] leading-none md:text-[30px]", accent ? accentText[accent] : "text-navy")}>{value}</div>
      {hint && <div className="mt-2 text-[12px] leading-snug text-fog">{hint}</div>}
    </div>
  );
}

/**
 * The page header. `sky` sets it inside a rounded panel holding the hero
 * photograph, with white type and glass KPI cards, as on the home page.
 */
export function ConsoleHeader({
  eyebrow,
  title,
  description,
  action,
  stats,
  variant = "plain",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  stats?: ReadoutProps[];
  variant?: "plain" | "sky";
}) {
  const sky = variant === "sky";
  const body = (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {sky ? (
            <p className="eyebrow glass-sky rounded-full py-[7px] pl-2.5 pr-3 uppercase tracking-[0.08em] text-white before:bg-white">{eyebrow}</p>
          ) : (
            <p className="eyebrow eyebrow-pill">{eyebrow}</p>
          )}
          <h1 className={cn("mt-4 text-[32px] leading-[1.04] md:text-[44px] [text-wrap:balance]", sky && "text-white")}>{title}</h1>
          {description && (
            <p className={cn("mt-3 max-w-2xl text-[15px] leading-relaxed", sky ? "text-white/85" : "text-tide")}>{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className={cn("mt-8 grid grid-cols-2 gap-3", stats.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4", sky && "mt-10")}>
          {stats.map((s) => (
            <Readout key={s.label} {...s} onSky={sky} />
          ))}
        </div>
      )}
    </>
  );

  if (sky) {
    return (
      <div className="mx-auto max-w-[1360px] px-3 pt-3 md:px-6 md:pt-5">
        <div className="relative isolate overflow-hidden rounded-[28px] px-5 pb-6 pt-8 md:rounded-[32px] md:px-10 md:pb-10 md:pt-12">
          <Image src="/hero.png" alt="" fill priority sizes="(min-width: 1360px) 1360px, 100vw" className="-z-20 object-cover object-[50%_30%]" />
          <div aria-hidden="true" className="sky-veil absolute inset-0 -z-10" />
          <div aria-hidden="true" className="grain -z-10 opacity-[0.06]" />
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_100%_at_85%_0%,rgb(150_224_222/0.35),transparent_70%),radial-gradient(ellipse_50%_80%_at_10%_0%,rgb(219_240_250/0.8),transparent_70%)]" />
      <div className="mx-auto max-w-[1360px] px-4 pt-8 md:px-6 md:pt-12">{body}</div>
    </div>
  );
}

/** The working area under the header. */
export function Console({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto max-w-[1360px] px-4 py-6 md:px-6 md:py-8", className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("card min-w-0 p-5 md:p-6", className)}>{children}</section>;
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="mb-1.5 text-[12px] font-semibold text-lagoon-deep">{eyebrow}</p>}
        <h2 className="font-sans text-[18px] font-semibold leading-snug tracking-[-0.02em]">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-tide">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export type Tone = Accent | "muted";

/** A stat on its own card. */
export function StatCard(props: ReadoutProps) {
  return <Readout {...props} />;
}

/** A small label over a figure, for use inside cards. */
export function StatPill({ label, value, tone, sub, onTint = false }: { label: string; value: string; tone?: Tone; sub?: string; onTint?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-2xl px-4 py-3", onTint ? "bg-white/75" : "bg-haze")}>
      <div className="truncate text-[12px] font-medium text-fog">{label}</div>
      <div
        className={cn(
          "readout mt-1 truncate font-display text-[20px] leading-none",
          tone === "amber" ? "text-amber-deep" : tone === "leaf" ? "text-leaf-deep" : tone === "rose" ? "text-rose-deep" : tone === "lagoon" ? "text-lagoon-deep" : "text-navy"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-[11.5px] text-fog">{sub}</div>}
    </div>
  );
}

export function Badge({ tone = "muted", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-2 pr-2.5 text-[12px] font-semibold leading-none",
        tone === "lagoon" && "bg-lagoon-soft text-lagoon-deep",
        tone === "amber" && "bg-amber-soft text-amber-deep",
        tone === "leaf" && "bg-leaf-soft text-leaf-deep",
        tone === "rose" && "bg-rose-soft text-rose-deep",
        tone === "muted" && "bg-haze-2 text-tide"
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {typeof children === "string" ? children.charAt(0).toUpperCase() + children.slice(1) : children}
    </span>
  );
}

/** A wallet address with its blockie, shortened. */
export function Address({ address, size = 22, className }: { address: string | null | undefined; size?: number; className?: string }) {
  if (!address) return <span className="text-fog">n/a</span>;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)} title={address}>
      <span className="shrink-0 rounded-full ring-2 ring-white" style={{ width: size, height: size }}>
        <Blockie address={address} className="block size-full" />
      </span>
      <span className="readout truncate text-[13px] text-navy">{shortAddress(address)}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-[13px] font-medium text-navy">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] leading-snug text-fog">{hint}</span>}
    </label>
  );
}

export function Input({ suffix, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  const numeric = props.inputMode === "decimal" || props.inputMode === "numeric";
  const input = <input {...props} className={cn("input h-11", numeric && "readout", suffix && "pr-16", props.className)} />;
  if (!suffix) return input;
  return (
    <span className="relative block">
      {input}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-haze px-1.5 py-0.5 text-[11.5px] font-semibold text-tide">
        {suffix}
      </span>
    </span>
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative block", className)}>
      <select {...props} className="input h-11 cursor-pointer appearance-none pr-10" />
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fog" aria-hidden="true" />
    </span>
  );
}

/** A row of pill options, for short choices such as a term or a scope. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  label,
  className,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T) => void;
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-1 rounded-2xl bg-haze p-1", disabled && "opacity-60", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition-all disabled:cursor-not-allowed",
              active ? "bg-white text-navy shadow-[0_1px_3px_rgb(11_37_48/0.12)]" : "text-tide hover:text-navy"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** An on/off switch with a title and a line of explanation. */
export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-2xl px-1 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-navy">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] leading-snug text-fog">{hint}</span>}
      </span>
      <span className={cn("relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-lagoon" : "bg-[#c6d7dc]")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "secondary" }) {
  return (
    <button
      {...props}
      className={cn(
        "btn cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "btn-danger",
        className
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-line bg-canvas/60 px-6 py-12 text-center">
      <Image src="/images/logo-mark.png" alt="" width={48} height={48} className="opacity-90 mark-glow" />
      <p className="mt-4 text-[15px] font-semibold text-navy">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-tide">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const NOTICE_ICON = { info: Info, success: CheckCircle2, warn: AlertTriangle, error: XCircle } as const;

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "success"; children: React.ReactNode }) {
  const Icon = NOTICE_ICON[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed",
        tone === "info" && "bg-lagoon-soft text-navy",
        tone === "success" && "bg-leaf-soft text-leaf-deep",
        tone === "warn" && "bg-amber-soft text-amber-deep",
        tone === "error" && "bg-rose-soft text-rose-deep"
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "info" && "text-lagoon")} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

export function Table({ children, minWidth = 640 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="scrollbar-none -mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
      <table className="ledger w-full border-collapse text-left text-[13.5px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("whitespace-nowrap pb-3 pr-4 text-[12px] font-medium text-fog", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("py-3.5 pr-4 align-middle text-tide", className)}>{children}</td>;
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-2xl bg-haze" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gauges                                                              */
/* ------------------------------------------------------------------ */

/** A progress bar filled with the accent gradient. */
export function Meter({ value, className, tone = "lagoon" }: { value: number; className?: string; tone?: "lagoon" | "amber" | "rose" }) {
  const pct = Math.max(0, Math.min(100, value));
  const fill =
    tone === "amber"
      ? "linear-gradient(90deg, #f0b25f, var(--color-amber))"
      : tone === "rose"
        ? "linear-gradient(90deg, #ec7b84, var(--color-rose))"
        : "linear-gradient(90deg, var(--color-aqua), var(--color-lagoon))";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-haze-2", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: fill }} />
    </div>
  );
}

/**
 * Loan-to-value on a track that runs to 80 percent, with the tier ceiling and
 * the liquidation line marked. Values are in basis points.
 */
export function LtvGauge({
  ltvBps,
  maxBps,
  liqBps,
  className,
  limitsOnly = false,
}: {
  ltvBps: number;
  maxBps: number;
  liqBps: number;
  className?: string;
  /** Show just the ceiling and liquidation marks, with a faint fill up to the ceiling. */
  limitsOnly?: boolean;
}) {
  const span = 8000;
  const at = (bps: number) => `${Math.max(0, Math.min(100, (bps / span) * 100))}%`;
  const over = ltvBps > maxBps;
  const valid = Number.isFinite(ltvBps) && ltvBps > 0;
  return (
    <div className={className}>
      <div className="relative h-2.5 rounded-full bg-haze-2">
        {limitsOnly && <div className="absolute inset-y-0 left-0 rounded-full bg-lagoon-soft" style={{ width: at(maxBps) }} />}
        {valid && !limitsOnly && (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{ width: at(ltvBps), background: over ? "linear-gradient(90deg,#f0b25f,var(--color-amber))" : "linear-gradient(90deg,var(--color-aqua),var(--color-lagoon))" }}
          />
        )}
        <span className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-tide/40" style={{ left: at(maxBps) }} aria-hidden="true" />
        <span className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-rose/70" style={{ left: at(liqBps) }} aria-hidden="true" />
      </div>
      <div className="relative mt-2 h-4 text-[11.5px]">
        <span className={cn("absolute left-0 font-semibold", over ? "text-amber-deep" : "text-navy")}>
          {limitsOnly ? "" : valid ? `LTV ${(ltvBps / 100).toFixed(1)}%` : "LTV n/a"}
        </span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap text-fog" style={{ left: at(maxBps) }}>
          Max {Math.round(maxBps / 100)}%
        </span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap text-rose-deep" style={{ left: at(liqBps) }}>
          Liq. {Math.round(liqBps / 100)}%
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overlays and links                                                  */
/* ------------------------------------------------------------------ */

/** A panel that slides in from the right over a dimmed page. Escape or the backdrop closes it. */
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-navy/25 backdrop-blur-[2px] animate-in fade-in" />
      <div className="absolute inset-y-2 right-2 flex w-[min(560px,calc(100vw-16px))] flex-col overflow-hidden rounded-[28px] bg-canvas shadow-[0_30px_80px_-20px_rgb(11_37_48/0.45)] animate-in slide-in-from-right-8 fade-in duration-300">
        <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-white/70 px-5 py-4 backdrop-blur">
          <p className="truncate text-[13px] font-semibold text-tide">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-9 items-center justify-center rounded-full bg-haze text-tide transition-colors hover:bg-haze-2 hover:text-navy">
            <X className="size-4" />
          </button>
        </div>
        <div className="scrollbar-none flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ExplorerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-lagoon-deep underline decoration-lagoon/30 underline-offset-4 hover:decoration-lagoon">
      {children}
    </Link>
  );
}
