/** Row types for the Supabase schema in supabase/schema.sql. Numeric columns arrive as strings. */

export type RequestStatus = "open" | "filled" | "cancelled" | "expired";
export type OfferStatus = "open" | "filled" | "cancelled" | "expired";
export type LoanStatus =
  | "active"
  | "refinancing"
  | "liquidating"
  | "repaid"
  | "settled"
  | "defaulted";
export type MarketSession = "regular" | "extended" | "closed";

export interface Profile {
  id: string;
  wallet_address: string | null;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Market {
  id: string;
  chain_id: number;
  collateral_symbol: string;
  collateral_name: string;
  collateral_address: string;
  collateral_decimals: number;
  loan_symbol: string;
  loan_address: string;
  loan_decimals: number;
  tier: number;
  tier_label: string;
  max_ltv_bps: number;
  liq_ltv_bps: number;
  closed_haircut_bps: number;
  exposure_cap: string;
  enabled: boolean;
}

export interface LatestPrice {
  market_id: string;
  price: string;
  session: MarketSession;
  multiplier: string;
  source: string | null;
  observed_at: string;
}

export interface ProtocolParam {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

export interface Attestation {
  id: string;
  profile_id: string | null;
  wallet_address: string;
  role: string;
  jurisdiction_class: string | null;
  investor_class: number | null;
  issuer: string | null;
  onchain_uid: string | null;
  status: "active" | "revoked";
  issued_at: string;
  expires_at: string;
}

export interface BorrowRequest {
  id: string;
  borrower_id: string;
  borrower_address: string;
  market_id: string;
  collateral_amount: string;
  principal: string;
  max_apr_bps: number;
  term_seconds: number;
  fill_deadline: string;
  salt: string;
  request_hash: string | null;
  signature: string | null;
  status: RequestStatus;
  loan_id: string | null;
  created_at: string;
}

export interface Offer {
  id: string;
  maker_id: string;
  maker_address: string;
  market_id: string;
  side: "lend" | "borrow";
  scope: "token" | "tier";
  tier: number | null;
  principal_min: string;
  principal_max: string;
  apr_bps: number;
  max_ltv_bps: number;
  term_seconds: number;
  expiry: string;
  nonce: string;
  salt: string;
  request_id: string | null;
  flags: number;
  offer_hash: string;
  signature: string;
  filled: string;
  status: OfferStatus;
  created_at: string;
}

export interface Loan {
  id: string;
  onchain_loan_id: number | null;
  request_id: string | null;
  borrower_id: string;
  borrower_address: string;
  market_id: string;
  collateral_amount: string;
  principal: string;
  origination_principal: string;
  blended_apr_bps: number;
  origination_price: string | null;
  started_at: string;
  maturity: string;
  term_seconds: number;
  status: LoanStatus;
  tx_hash: string | null;
  created_at: string;
}

export interface Slice {
  id: string;
  loan_id: string;
  offer_id: string | null;
  lender_id: string;
  lender_address: string;
  principal: string;
  apr_bps: number;
  flags: number;
  position_token_id: number | null;
  interest_paid: string;
  status: "active" | "repaid" | "settled";
  created_at: string;
}

export interface LoanEvent {
  id: number;
  loan_id: string;
  actor_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  tx_hash: string | null;
  created_at: string;
}

export interface ProtocolStats {
  active_loans: number;
  outstanding_principal: string;
  total_loans: number;
  total_originated: string;
  open_requests: number;
  open_demand: string;
  open_offers: number;
  open_lend_capacity: string;
  liquidations: number;
  repaid_loans: number;
  unique_lenders: number;
  unique_borrowers: number;
}

/** Parsed protocol_params rows the UI relies on. Absent keys fall back to safe defaults at read time. */
export interface ProtocolConfig {
  terms: number[];
  fees: {
    originationBps: number;
    interestShareBps: number;
    refinanceBps: number;
    idleYieldShareBps: number;
  };
  loan: {
    minInterestPeriod: number;
    graceWindow: number;
    sequencerGrace: number;
    warningHf: number;
  };
  auction: {
    startPremiumBps: number;
    floorBpsRegular: number;
    floorBpsClosed: number;
    duration: number;
    penaltyBps: number;
    keeperShareBps: number;
    lenderPenaltyShareBps: number;
  };
  refinance: { capSpreadBps: number; duration: number };
  tiers: Record<
    string,
    { label: string; name: string; maxLtvBps: number; liqLtvBps: number; closedHaircutBps: number }
  >;
  chain: { id: number; name: string; explorer: string | null; settlement_asset: string };
  deployment: Record<string, string | number | null>;
}

export const OFFER_FLAGS = {
  SELF_LIQUIDATE: 1,
  NO_CLOSED_MARKET_LIQUIDATION: 2,
  PARK_IDLE: 4,
} as const;
