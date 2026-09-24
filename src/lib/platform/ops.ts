import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attestation, BorrowRequest, Offer, Profile } from "./types";

/**
 * Authenticated database operations. They run on the server with a service-role client that carries the
 * verified Privy user id, and are reached from the browser through POST /api/platform/db.
 *
 * Every operation re-checks ownership against `actor` before touching rows the user must own, on top of the
 * checks the security-definer functions perform through app_user_id().
 */

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

const isHex = (v: unknown, bytes?: number) =>
  typeof v === "string" && /^0x[0-9a-fA-F]*$/.test(v) && (bytes === undefined || v.length === 2 + bytes * 2);
const isAddress = (v: unknown) => isHex(v, 20);
const isUuid = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
const isNum = (v: unknown) => typeof v === "string" ? /^\d+(\.\d+)?$/.test(v) : typeof v === "number" && Number.isFinite(v);
const isInt = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

function require_(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export type OpArgs = Record<string, unknown>;

export const ops = {
  async getProfile(db: SupabaseClient, actor: string): Promise<Profile | null> {
    const res = await db.from("profiles").select("*").eq("id", actor).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data;
  },

  async upsertProfile(db: SupabaseClient, actor: string, a: OpArgs): Promise<Profile> {
    const row = {
      id: actor,
      wallet_address: typeof a.wallet_address === "string" ? a.wallet_address : null,
      email: typeof a.email === "string" ? a.email : null,
      display_name: typeof a.display_name === "string" ? a.display_name.slice(0, 80) : null,
    };
    return unwrap(await db.from("profiles").upsert(row, { onConflict: "id" }).select("*").single());
  },

  async getMyAttestations(db: SupabaseClient, actor: string): Promise<Attestation[]> {
    return unwrap(await db.from("attestations").select("*").eq("profile_id", actor).order("issued_at", { ascending: false })) ?? [];
  },

  async insertRequest(db: SupabaseClient, actor: string, a: OpArgs): Promise<BorrowRequest> {
    require_(isAddress(a.borrower_address), "The borrower address is not a valid address");
    require_(isUuid(a.market_id), "The market id is not a valid uuid");
    require_(isNum(a.collateral_amount) && isNum(a.principal), "Amounts have to be numbers");
    require_(isInt(a.max_apr_bps, 0, 10000) && isInt(a.term_seconds, 1, 10 * 365 * 86400), "bad apr or term");
    require_(typeof a.fill_deadline === "string" && !Number.isNaN(Date.parse(a.fill_deadline)), "bad fill_deadline");
    require_(isHex(a.salt, 32) && isHex(a.request_hash, 32) && isHex(a.signature), "bad salt, hash or signature");
    const row = {
      borrower_id: actor,
      borrower_address: a.borrower_address,
      market_id: a.market_id,
      collateral_amount: a.collateral_amount,
      principal: a.principal,
      max_apr_bps: a.max_apr_bps,
      term_seconds: a.term_seconds,
      fill_deadline: a.fill_deadline,
      salt: a.salt,
      request_hash: a.request_hash,
      signature: a.signature,
    };
    return unwrap(await db.from("borrow_requests").insert(row).select("*").single());
  },

  async insertOffer(db: SupabaseClient, actor: string, a: OpArgs): Promise<Offer> {
    require_(isAddress(a.maker_address), "The maker address is not a valid address");
    require_(isUuid(a.market_id), "The market id is not a valid uuid");
    require_(a.side === "lend", "only lend offers are accepted");
    require_(a.scope === "token" || a.scope === "tier", "Scope has to be either token or tier");
    require_(isNum(a.principal_min) && isNum(a.principal_max), "Amounts have to be numbers");
    require_(isInt(a.apr_bps, 0, 10000) && isInt(a.max_ltv_bps, 0, 10000) && isInt(a.term_seconds, 1, 10 * 365 * 86400), "bad apr, ltv or term");
    require_(typeof a.expiry === "string" && !Number.isNaN(Date.parse(a.expiry)), "bad expiry");
    require_(typeof a.nonce === "string" && /^\d+$/.test(a.nonce), "bad nonce");
    require_(isHex(a.salt, 32) && isHex(a.offer_hash, 32) && isHex(a.signature), "bad salt, hash or signature");
    require_(a.request_id === null || isUuid(a.request_id), "bad request_id");
    require_(isInt(a.flags, 0, 255), "bad flags");
    const row = {
      maker_id: actor,
      maker_address: a.maker_address,
      market_id: a.market_id,
      side: "lend",
      scope: a.scope,
      tier: a.scope === "tier" && isInt(a.tier, 1, 255) ? a.tier : null,
      principal_min: a.principal_min,
      principal_max: a.principal_max,
      apr_bps: a.apr_bps,
      max_ltv_bps: a.max_ltv_bps,
      term_seconds: a.term_seconds,
      expiry: a.expiry,
      nonce: a.nonce,
      salt: a.salt,
      request_id: a.request_id,
      flags: a.flags,
      offer_hash: a.offer_hash,
      signature: a.signature,
    };
    return unwrap(await db.from("offers").insert(row).select("*").single());
  },

  async cancelRequest(db: SupabaseClient, _actor: string, a: OpArgs): Promise<null> {
    require_(isUuid(a.id), "The id is not a valid uuid");
    const res = await db.rpc("cancel_request", { p_request_id: a.id });
    if (res.error) throw new Error(res.error.message);
    return null;
  },

  async cancelOffer(db: SupabaseClient, _actor: string, a: OpArgs): Promise<null> {
    require_(isUuid(a.id), "The id is not a valid uuid");
    const res = await db.rpc("cancel_offer", { p_offer_id: a.id });
    if (res.error) throw new Error(res.error.message);
    return null;
  },

  async settleRequest(db: SupabaseClient, _actor: string, a: OpArgs): Promise<string> {
    require_(isUuid(a.request_id), "The request id is not a valid uuid");
    require_(Array.isArray(a.offer_ids) && a.offer_ids.length > 0 && a.offer_ids.every(isUuid), "Every offer id has to be a uuid");
    require_(a.tx_hash === null || isHex(a.tx_hash, 32), "bad tx_hash");
    const res = await db.rpc("settle_request", {
      p_request_id: a.request_id,
      p_offer_ids: a.offer_ids,
      p_tx_hash: a.tx_hash,
      p_onchain_loan_id: typeof a.onchain_loan_id === "number" ? a.onchain_loan_id : null,
    });
    if (res.error) throw new Error(res.error.message);
    return res.data as string;
  },

  async recordRepayment(db: SupabaseClient, _actor: string, a: OpArgs): Promise<string> {
    require_(isUuid(a.loan_id), "The loan id is not a valid uuid");
    require_(typeof a.amount === "number" && a.amount > 0, "The amount has to be greater than zero");
    require_(a.tx_hash === null || isHex(a.tx_hash, 32), "bad tx_hash");
    const res = await db.rpc("record_repayment", { p_loan_id: a.loan_id, p_amount: a.amount, p_tx_hash: a.tx_hash });
    if (res.error) throw new Error(res.error.message);
    return res.data as string;
  },

  async recordCollateralAdded(db: SupabaseClient, _actor: string, a: OpArgs): Promise<null> {
    require_(isUuid(a.loan_id), "The loan id is not a valid uuid");
    require_(typeof a.amount === "number" && a.amount > 0, "The amount has to be greater than zero");
    require_(a.tx_hash === null || isHex(a.tx_hash, 32), "bad tx_hash");
    const res = await db.rpc("record_collateral_added", { p_loan_id: a.loan_id, p_amount: a.amount, p_tx_hash: a.tx_hash });
    if (res.error) throw new Error(res.error.message);
    return null;
  },
};

export type OpName = keyof typeof ops;
