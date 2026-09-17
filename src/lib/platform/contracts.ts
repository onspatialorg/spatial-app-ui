import { createWalletClient, custom, parseUnits, type Address, type EIP1193Provider, type Hex } from "viem";
import { robinhoodChain } from "./chain";
import type { BorrowRequest, Market, Offer, ProtocolConfig } from "./types";
import { tierSentinel, ZERO_BYTES32 } from "./eip712";

/** Minimal ABI for CreditHub.originate, matching contracts/src/interfaces/ICreditHub.sol. */
export const LOAN_DESK_ABI = [
  {
    type: "function",
    name: "originate",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
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
      },
      { name: "borrowerSignature", type: "bytes" },
      {
        name: "offers",
        type: "tuple[]",
        components: [
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
      },
      { name: "signatures", type: "bytes[]" },
    ],
    outputs: [{ name: "loanId", type: "uint256" }],
  },
] as const;

export function deskAddress(config: ProtocolConfig | null): Address | null {
  const v = config?.deployment?.CreditHub;
  return typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : null;
}

/** Submit `originate` on-chain through the user's wallet provider. Returns the transaction hash. */
export async function submitSettleOnChain(
  provider: EIP1193Provider,
  account: Address,
  settlement: Address,
  request: BorrowRequest,
  market: Market,
  picks: { offer: Offer; fill: number }[]
): Promise<Hex> {
  const client = createWalletClient({ account, chain: robinhoodChain, transport: custom(provider) });
  const req = {
    borrower: request.borrower_address as Address,
    collateralToken: market.collateral_address as Address,
    loanToken: market.loan_address as Address,
    collateralAmount: parseUnits(request.collateral_amount, market.collateral_decimals),
    principal: parseUnits(request.principal, market.loan_decimals),
    maxAprBps: request.max_apr_bps,
    termSeconds: request.term_seconds,
    fillDeadline: Math.floor(new Date(request.fill_deadline).getTime() / 1000),
    salt: request.salt as Hex,
  };
  const offers = picks.map(({ offer }) => ({
    maker: offer.maker_address as Address,
    side: 0,
    collateralToken: (offer.scope === "tier" ? tierSentinel(offer.tier ?? market.tier) : market.collateral_address) as Address,
    loanToken: market.loan_address as Address,
    principalMin: parseUnits(offer.principal_min, market.loan_decimals),
    principalMax: parseUnits(offer.principal_max, market.loan_decimals),
    aprBps: offer.apr_bps,
    maxLtvBps: offer.max_ltv_bps,
    termSeconds: offer.term_seconds,
    expiry: Math.floor(new Date(offer.expiry).getTime() / 1000),
    nonce: BigInt(offer.nonce),
    salt: offer.salt as Hex,
    requestId: (offer.request_id ? request.request_hash ?? ZERO_BYTES32 : ZERO_BYTES32) as Hex,
    flags: offer.flags,
  }));
  const signatures = picks.map(({ offer }) => offer.signature as Hex);
  return client.writeContract({
    address: settlement,
    abi: LOAN_DESK_ABI,
    functionName: "originate",
    args: [req, "0x", offers, signatures],
  });
}
