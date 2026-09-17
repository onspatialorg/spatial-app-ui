import type { Loan, Market, Offer, ProtocolConfig, Slice } from "./types";

export const BPS = 10_000;
export const YEAR_SECONDS = 31_536_000;

export const num = (v: string | number | null | undefined): number =>
  v === null || v === undefined || v === "" ? 0 : Number(v);

/** Collateral value in loan-token units. */
export function collateralValue(collateralAmount: number, price: number): number {
  return collateralAmount * price;
}

export function ltvBps(principal: number, value: number): number {
  return value <= 0 ? Infinity : (principal / value) * BPS;
}

/** Max borrowable against `collateralAmount` at the tier's max LTV for the current session. */
export function maxBorrowable(
  collateralAmount: number,
  price: number,
  market: Pick<Market, "max_ltv_bps" | "closed_haircut_bps">,
  session: string
): number {
  const haircut = session === "closed" ? market.closed_haircut_bps : 0;
  return (collateralValue(collateralAmount, price) * (market.max_ltv_bps - haircut)) / BPS;
}

export function effectiveLiqLtvBps(
  market: Pick<Market, "liq_ltv_bps" | "closed_haircut_bps">,
  session: string
): number {
  return market.liq_ltv_bps - (session === "closed" ? market.closed_haircut_bps : 0);
}

export function healthFactor(
  collateralAmount: number,
  price: number,
  debt: number,
  market: Pick<Market, "liq_ltv_bps" | "closed_haircut_bps">,
  session: string
): number {
  if (debt <= 0) return Infinity;
  return (collateralValue(collateralAmount, price) * effectiveLiqLtvBps(market, session)) / BPS / debt;
}

export function simpleInterest(principal: number, aprBps: number, elapsedSeconds: number): number {
  return (principal * aprBps * elapsedSeconds) / (BPS * YEAR_SECONDS);
}

/** Debt of a loan at `at`, honouring the minimum interest period like the contracts. */
export function loanDebt(
  loan: Pick<Loan, "started_at">,
  slices: Pick<Slice, "principal" | "apr_bps" | "status">[],
  config: Pick<ProtocolConfig, "loan">,
  at: Date = new Date()
): { principal: number; interest: number; total: number } {
  const elapsed = Math.max(
    (at.getTime() - new Date(loan.started_at).getTime()) / 1000,
    config.loan.minInterestPeriod
  );
  let principal = 0;
  let interest = 0;
  for (const s of slices) {
    if (s.status !== "active") continue;
    const p = num(s.principal);
    principal += p;
    interest += simpleInterest(p, s.apr_bps, elapsed);
  }
  return { principal, interest, total: principal + interest };
}

export function blendedAprBps(slices: Pick<Slice, "principal" | "apr_bps">[]): number {
  let weighted = 0;
  let total = 0;
  for (const s of slices) {
    weighted += num(s.principal) * s.apr_bps;
    total += num(s.principal);
  }
  return total === 0 ? 0 : weighted / total;
}

/**
 * Greedy match: cheapest open lend offers first, until the principal is covered.
 * Mirrors the relayer's matching described in the documentation.
 */
export function matchOffers(
  offers: Offer[],
  principal: number,
  opts: { maxAprBps: number; termSeconds: number; ltv: number; marketId: string; tier: number; requestId: string; borrowerId: string }
): { picks: { offer: Offer; fill: number }[]; covered: number; blendedAprBps: number } {
  const eligible = offers
    .filter(
      (o) =>
        o.status === "open" &&
        o.side === "lend" &&
        new Date(o.expiry).getTime() > Date.now() &&
        o.term_seconds === opts.termSeconds &&
        o.apr_bps <= opts.maxAprBps &&
        o.max_ltv_bps >= opts.ltv &&
        o.maker_id !== opts.borrowerId &&
        (o.request_id === null || o.request_id === opts.requestId) &&
        ((o.scope === "token" && o.market_id === opts.marketId) || (o.scope === "tier" && o.tier === opts.tier)) &&
        num(o.principal_max) - num(o.filled) > 0
    )
    .sort((a, b) => a.apr_bps - b.apr_bps || (a.request_id ? -1 : 1));

  const picks: { offer: Offer; fill: number }[] = [];
  let remaining = principal;
  for (const o of eligible) {
    if (remaining <= 0) break;
    const capacity = num(o.principal_max) - num(o.filled);
    const fill = Math.min(capacity, remaining);
    if (fill < num(o.principal_min) && fill !== capacity) continue;
    picks.push({ offer: o, fill });
    remaining -= fill;
  }
  const covered = principal - Math.max(remaining, 0);
  const weighted = picks.reduce((acc, p) => acc + p.fill * p.offer.apr_bps, 0);
  return { picks, covered, blendedAprBps: covered === 0 ? 0 : weighted / covered };
}

/** Lowest APR with capacity in the book for a market and term, used as the indicative rate. */
export function indicativeRate(offers: Offer[], marketId: string, tier: number, termSeconds: number): number | null {
  const candidates = offers.filter(
    (o) =>
      o.status === "open" &&
      o.side === "lend" &&
      new Date(o.expiry).getTime() > Date.now() &&
      o.term_seconds === termSeconds &&
      num(o.principal_max) - num(o.filled) > 0 &&
      ((o.scope === "token" && o.market_id === marketId) || (o.scope === "tier" && o.tier === tier))
  );
  if (candidates.length === 0) return null;
  return Math.min(...candidates.map((o) => o.apr_bps));
}
