import { platformEnv } from "./env";
import type { PlatformClient } from "./supabase";
import type {
  Attestation,
  BorrowRequest,
  LatestPrice,
  Loan,
  LoanEvent,
  Market,
  Offer,
  Profile,
  ProtocolConfig,
  ProtocolParam,
  ProtocolStats,
  Slice,
} from "./types";

/**
 * Two kinds of access:
 *  - Public reads use the anon Supabase client directly (`db`). Markets, prices, parameters, the order book,
 *    loans, slices and events are readable by everyone.
 *  - Authenticated operations go through POST /api/platform/db (`api`). The route verifies the Privy token and
 *    runs the operation with a service-role client acting as the verified user.
 */
export type PlatformApi = <T>(op: string, args?: Record<string, unknown>) => Promise<T>;

function unwrap<T>(res: { data: T | null; error: { message: string } | null }, fallback: T): T {
  if (res.error) throw new Error(res.error.message);
  return res.data ?? fallback;
}

// ---------------------------------------------------------------------------
// Configuration (public)
// ---------------------------------------------------------------------------

export async function getMarkets(db: PlatformClient): Promise<Market[]> {
  return unwrap(
    await db
      .from("markets")
      .select("*")
      .eq("chain_id", platformEnv.chainId)
      .eq("enabled", true)
      .order("tier")
      .order("collateral_symbol"),
    [],
  );
}

export async function getLatestPrices(db: PlatformClient): Promise<Record<string, LatestPrice>> {
  const rows = unwrap<LatestPrice[]>(await db.from("market_latest_prices").select("*"), []);
  return Object.fromEntries(rows.map((r) => [r.market_id, r]));
}

const DEFAULT_CONFIG: ProtocolConfig = {
  terms: [],
  fees: { originationBps: 0, interestShareBps: 0, refinanceBps: 0, idleYieldShareBps: 0 },
  loan: { minInterestPeriod: 0, graceWindow: 0, sequencerGrace: 0, warningHf: 1.1 },
  auction: {
    startPremiumBps: 0,
    floorBpsRegular: 0,
    floorBpsClosed: 0,
    duration: 0,
    penaltyBps: 0,
    keeperShareBps: 0,
    lenderPenaltyShareBps: 0,
  },
  refinance: { capSpreadBps: 0, duration: 0 },
  tiers: {},
  chain: { id: 0, name: "", explorer: null, settlement_asset: "" },
  deployment: {},
};

export async function getProtocolConfig(db: PlatformClient): Promise<ProtocolConfig> {
  const rows = unwrap<ProtocolParam[]>(await db.from("protocol_params").select("*"), []);
  const cfg: ProtocolConfig = structuredClone(DEFAULT_CONFIG);
  for (const r of rows) {
    switch (r.key) {
      case "terms":
        cfg.terms = (r.value as number[]).map(Number);
        break;
      case "fees":
        cfg.fees = { ...cfg.fees, ...(r.value as ProtocolConfig["fees"]) };
        break;
      case "loan":
        cfg.loan = { ...cfg.loan, ...(r.value as ProtocolConfig["loan"]) };
        break;
      case "auction":
        cfg.auction = { ...cfg.auction, ...(r.value as ProtocolConfig["auction"]) };
        break;
      case "refinance":
        cfg.refinance = { ...cfg.refinance, ...(r.value as ProtocolConfig["refinance"]) };
        break;
      case "tiers":
        cfg.tiers = r.value as ProtocolConfig["tiers"];
        break;
      case "chain":
        cfg.chain = { ...cfg.chain, ...(r.value as ProtocolConfig["chain"]) };
        break;
      case "deployment":
        cfg.deployment = r.value as ProtocolConfig["deployment"];
        break;
    }
  }
  return cfg;
}

export async function getStats(db: PlatformClient): Promise<ProtocolStats | null> {
  const rows = unwrap<ProtocolStats[]>(await db.from("protocol_stats").select("*"), []);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Profile and eligibility (authenticated)
// ---------------------------------------------------------------------------

export async function getProfile(api: PlatformApi): Promise<Profile | null> {
  return api<Profile | null>("getProfile");
}

export async function upsertProfile(
  api: PlatformApi,
  profile: Partial<Pick<Profile, "wallet_address" | "email" | "display_name">>
): Promise<Profile> {
  return api<Profile>("upsertProfile", profile);
}

export async function getMyAttestations(api: PlatformApi): Promise<Attestation[]> {
  return api<Attestation[]>("getMyAttestations");
}

// ---------------------------------------------------------------------------
// Order book
// ---------------------------------------------------------------------------

export async function getOpenRequests(db: PlatformClient): Promise<BorrowRequest[]> {
  return unwrap(
    await db
      .from("borrow_requests")
      .select("*")
      .eq("status", "open")
      .gt("fill_deadline", new Date().toISOString())
      .order("created_at", { ascending: false }),
    []
  );
}

export async function getMyRequests(db: PlatformClient, userId: string): Promise<BorrowRequest[]> {
  return unwrap(
    await db.from("borrow_requests").select("*").eq("borrower_id", userId).order("created_at", { ascending: false }),
    []
  );
}

export async function getRequest(db: PlatformClient, id: string): Promise<BorrowRequest | null> {
  const res = await db.from("borrow_requests").select("*").eq("id", id).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function getOpenOffers(db: PlatformClient): Promise<Offer[]> {
  return unwrap(
    await db
      .from("offers")
      .select("*")
      .eq("status", "open")
      .eq("side", "lend")
      .gt("expiry", new Date().toISOString())
      .order("apr_bps"),
    []
  );
}

export async function getMyOffers(db: PlatformClient, userId: string): Promise<Offer[]> {
  return unwrap(await db.from("offers").select("*").eq("maker_id", userId).order("created_at", { ascending: false }), []);
}

export async function insertRequest(
  api: PlatformApi,
  row: Omit<BorrowRequest, "id" | "borrower_id" | "status" | "loan_id" | "created_at">
): Promise<BorrowRequest> {
  return api<BorrowRequest>("insertRequest", row);
}

export async function insertOffer(
  api: PlatformApi,
  row: Omit<Offer, "id" | "maker_id" | "status" | "filled" | "created_at">
): Promise<Offer> {
  return api<Offer>("insertOffer", row);
}

export async function cancelRequest(api: PlatformApi, id: string): Promise<void> {
  await api("cancelRequest", { id });
}

export async function cancelOffer(api: PlatformApi, id: string): Promise<void> {
  await api("cancelOffer", { id });
}

export async function settleRequest(
  api: PlatformApi,
  requestId: string,
  offerIds: string[],
  txHash: string | null,
  onchainLoanId: number | null
): Promise<string> {
  return api<string>("settleRequest", { request_id: requestId, offer_ids: offerIds, tx_hash: txHash, onchain_loan_id: onchainLoanId });
}

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------

export async function getLoans(db: PlatformClient, limit = 200): Promise<Loan[]> {
  return unwrap(await db.from("loans").select("*").order("created_at", { ascending: false }).limit(limit), []);
}

export async function getLoan(db: PlatformClient, id: string): Promise<Loan | null> {
  const res = await db.from("loans").select("*").eq("id", id).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function getMyLoans(db: PlatformClient, userId: string): Promise<Loan[]> {
  return unwrap(await db.from("loans").select("*").eq("borrower_id", userId).order("created_at", { ascending: false }), []);
}

export async function getSlicesForLoans(db: PlatformClient, loanIds: string[]): Promise<Slice[]> {
  if (loanIds.length === 0) return [];
  return unwrap(await db.from("slices").select("*").in("loan_id", loanIds), []);
}

export async function getMySlices(db: PlatformClient, userId: string): Promise<Slice[]> {
  return unwrap(await db.from("slices").select("*").eq("lender_id", userId).order("created_at", { ascending: false }), []);
}

export async function getLoanEvents(db: PlatformClient, loanId: string): Promise<LoanEvent[]> {
  return unwrap(await db.from("loan_events").select("*").eq("loan_id", loanId).order("created_at", { ascending: false }), []);
}

export async function recordRepayment(api: PlatformApi, loanId: string, amount: number, txHash: string | null): Promise<string> {
  return api<string>("recordRepayment", { loan_id: loanId, amount, tx_hash: txHash });
}

export async function recordCollateralAdded(api: PlatformApi, loanId: string, amount: number, txHash: string | null): Promise<void> {
  await api("recordCollateralAdded", { loan_id: loanId, amount, tx_hash: txHash });
}
