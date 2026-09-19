import { hashTypedData, parseUnits, type Address, type Hex } from "viem";
import type { Market } from "./types";

/** EIP-712 domain and types matching contracts/src/libraries/QuoteHash.sol. */
export const OFFER_TYPES = {
  LendOffer: [
    { name: "maker", type: "address" },
    { name: "side", type: "uint8" },
    { name: "collateralToken", type: "address" },
    { name: "loanToken", type: "address" },
    { name: "principalMin", type: "uint256" },
    { name: "principalMax", type: "uint256" },
    { name: "aprBps", type: "uint16" },
    { name: "maxLtvBps", type: "uint16" },
    { name: "termSeconds", type: "uint32" },
    { name: "expiry", type: "uint40" },
    { name: "nonce", type: "uint256" },
    { name: "salt", type: "bytes32" },
    { name: "requestId", type: "bytes32" },
    { name: "flags", type: "uint8" },
  ],
} as const;

export const REQUEST_TYPES = {
  BorrowRequest: [
    { name: "borrower", type: "address" },
    { name: "collateralToken", type: "address" },
    { name: "loanToken", type: "address" },
    { name: "collateralAmount", type: "uint256" },
    { name: "principal", type: "uint256" },
    { name: "maxAprBps", type: "uint16" },
    { name: "termSeconds", type: "uint32" },
    { name: "fillDeadline", type: "uint40" },
    { name: "salt", type: "bytes32" },
  ],
} as const;

const EIP712_DOMAIN_TYPE = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
export const ZERO_BYTES32 = `0x${"0".repeat(64)}` as Hex;

export function domain(chainId: number, verifyingContract: Address | null) {
  return {
    name: "Spatial",
    version: "1",
    chainId: BigInt(chainId),
    verifyingContract: verifyingContract ?? ZERO_ADDRESS,
  } as const;
}

/** Tier sentinel used by standing offers: address(uint160(tier)). */
export function tierSentinel(tier: number): Address {
  return `0x${tier.toString(16).padStart(40, "0")}` as Address;
}

export function randomBytes32(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}` as Hex;
}

/** Nonce derived from time and randomness; fits comfortably in the on-chain bitmap. */
export function randomNonce(): bigint {
  const hi = BigInt(Math.floor(Date.now() / 1000));
  const lo = BigInt(Math.floor(Math.random() * 2 ** 32));
  return (hi << BigInt(32)) | lo;
}

export interface OfferInput {
  maker: Address;
  market: Market;
  scope: "token" | "tier";
  principalMin: string;
  principalMax: string;
  aprBps: number;
  maxLtvBps: number;
  termSeconds: number;
  expiry: Date;
  nonce: bigint;
  salt: Hex;
  requestId: Hex;
  flags: number;
}

export function buildOfferMessage(i: OfferInput) {
  return {
    maker: i.maker,
    side: 0,
    collateralToken: (i.scope === "tier" ? tierSentinel(i.market.tier) : i.market.collateral_address) as Address,
    loanToken: i.market.loan_address as Address,
    principalMin: parseUnits(i.principalMin || "0", i.market.loan_decimals),
    principalMax: parseUnits(i.principalMax, i.market.loan_decimals),
    aprBps: i.aprBps,
    maxLtvBps: i.maxLtvBps,
    termSeconds: i.termSeconds,
    expiry: Math.floor(i.expiry.getTime() / 1000),
    nonce: i.nonce,
    salt: i.salt,
    requestId: i.requestId,
    flags: i.flags,
  };
}

export interface RequestInput {
  borrower: Address;
  market: Market;
  collateralAmount: string;
  principal: string;
  maxAprBps: number;
  termSeconds: number;
  fillDeadline: Date;
  salt: Hex;
}

export function buildRequestMessage(i: RequestInput) {
  return {
    borrower: i.borrower,
    collateralToken: i.market.collateral_address as Address,
    loanToken: i.market.loan_address as Address,
    collateralAmount: parseUnits(i.collateralAmount, i.market.collateral_decimals),
    principal: parseUnits(i.principal, i.market.loan_decimals),
    maxAprBps: i.maxAprBps,
    termSeconds: i.termSeconds,
    fillDeadline: Math.floor(i.fillDeadline.getTime() / 1000),
    salt: i.salt,
  };
}

export function offerTypedData(chainId: number, verifyingContract: Address | null, message: ReturnType<typeof buildOfferMessage>) {
  return {
    domain: domain(chainId, verifyingContract),
    types: OFFER_TYPES,
    primaryType: "LendOffer" as const,
    message,
  };
}

export function requestTypedData(chainId: number, verifyingContract: Address | null, message: ReturnType<typeof buildRequestMessage>) {
  return {
    domain: domain(chainId, verifyingContract),
    types: REQUEST_TYPES,
    primaryType: "BorrowRequest" as const,
    message,
  };
}

export function hashOffer(chainId: number, verifyingContract: Address | null, message: ReturnType<typeof buildOfferMessage>): Hex {
  return hashTypedData(offerTypedData(chainId, verifyingContract, message));
}

export function hashRequest(chainId: number, verifyingContract: Address | null, message: ReturnType<typeof buildRequestMessage>): Hex {
  return hashTypedData(requestTypedData(chainId, verifyingContract, message));
}

/**
 * Privy's `signTypedData` expects the eth-sig-util shape with an explicit EIP712Domain type and
 * JSON-safe values, so bigints are stringified here.
 */
export function toPrivyTypedData(td: {
  domain: ReturnType<typeof domain>;
  types: Record<string, readonly { name: string; type: string }[]>;
  primaryType: string;
  message: Record<string, unknown>;
}) {
  const jsonSafe = (v: unknown): unknown =>
    typeof v === "bigint" ? v.toString() : Array.isArray(v) ? v.map(jsonSafe) : v;
  const message: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(td.message)) message[k] = jsonSafe(v);
  return {
    types: { EIP712Domain: EIP712_DOMAIN_TYPE, ...Object.fromEntries(Object.entries(td.types).map(([k, v]) => [k, [...v]])) },
    primaryType: td.primaryType,
    domain: {
      name: td.domain.name,
      version: td.domain.version,
      chainId: Number(td.domain.chainId),
      verifyingContract: td.domain.verifyingContract,
    },
    message,
  };
}
