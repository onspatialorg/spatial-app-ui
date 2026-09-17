export function fmtMoney(v: number | string | null | undefined, symbol = "", digits = 2): string {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  if (!Number.isFinite(n)) return "n/a";
  const s = n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return symbol ? `${s} ${symbol}` : s;
}

export function fmtCompact(v: number | string | null | undefined, symbol = ""): string {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  if (!Number.isFinite(n)) return "n/a";
  const s = n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
  return symbol ? `${s} ${symbol}` : s;
}

export function fmtBps(bps: number | null | undefined, digits = 2): string {
  if (bps === null || bps === undefined || !Number.isFinite(bps)) return "n/a";
  return `${(bps / 100).toFixed(digits)}%`;
}

export function fmtHf(hf: number): string {
  if (!Number.isFinite(hf)) return "∞";
  return hf.toFixed(2);
}

export function shortAddress(a: string | null | undefined): string {
  if (!a) return "no address";
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function fmtTerm(seconds: number): string {
  const d = Math.round(seconds / 86_400);
  return d === 1 ? "1 day" : `${d} days`;
}

export function fmtDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function fmtCountdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ${h % 24}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function statusTone(status: string): "lagoon" | "amber" | "leaf" | "rose" | "muted" {
  switch (status) {
    case "open":
    case "filled":
      return "lagoon";
    case "active":
    case "repaid":
      return "leaf";
    case "refinancing":
      return "amber";
    case "liquidating":
    case "defaulted":
      return "rose";
    default:
      return "muted";
  }
}

/** Turns thrown values into a short, readable message. Detects HTML bodies from a misconfigured backend. */
export function friendlyError(e: unknown, fallback = "That did not go through"): string {
  const raw = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  if (!raw) return fallback;
  if (/<!doctype|<html/i.test(raw)) {
    return "Instead of JSON, the data service answered with a web page. Make sure NEXT_PUBLIC_SUPABASE_URL is right and that the schema is in place.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return "The data service is unreachable. Confirm the Supabase URL in NEXT_PUBLIC_SUPABASE_URL and look at your connection.";
  }
  return raw.length > 240 ? `${raw.slice(0, 240)}…` : raw;
}
