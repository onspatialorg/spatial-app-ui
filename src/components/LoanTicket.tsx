import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Blockie } from "@/components/Blockie";
import { CompanyMark } from "@/components/TokenAvatar";
import { cn } from "@/lib/utils";

/**
 * A worked example of one syndicated loan, laid out the way a card in the
 * Explorer is. Every figure here is illustrative.
 */
const SLICES = [
  { lender: "0x71c3…9e4a", address: "0x71c3a0d5f1b84e2c9a07d36b5e8f12c4d0a39e4a", amount: 5000, apr: 8.5 },
  { lender: "0xb02f…17d3", address: "0xb02f6e91c47a3d58f0b2e7a14c9d86e35fa017d3", amount: 10000, apr: 8.9 },
  { lender: "0x4e88…c0b1", address: "0x4e8817b3a9c25d06e4f71b8a2d93c5e6f048c0b1", amount: 5000, apr: 9.0 },
] as const;

const PRINCIPAL = 20000;
const COLLATERAL_UNITS = 250;
const COLLATERAL_PRICE = 176.4;
const COLLATERAL_VALUE = COLLATERAL_UNITS * COLLATERAL_PRICE;
const MAX_LTV = 0.55;
const LIQ_LTV = 0.7;
const ltv = PRINCIPAL / COLLATERAL_VALUE;
const healthFactor = (COLLATERAL_VALUE * LIQ_LTV) / PRINCIPAL;
const blendedApr = SLICES.reduce((acc, s) => acc + s.amount * s.apr, 0) / PRINCIPAL;

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
/** Position on the LTV meter, which runs from 0 to 80 percent. */
const onMeter = (v: number) => `${(v / 0.8) * 100}%`;

export function LoanTicket({ className }: { className?: string }) {
  return (
    <div
      className={cn("card overflow-hidden rounded-[28px] p-2 text-[14px] text-tide", className)}
      aria-label="One syndicated Spatial loan, worked through as an example"
    >
      {/* Header: what was asked for, and that it filled */}
      <div className="flex items-center gap-3.5 px-4 pb-4 pt-4">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#76b900] text-white" title="NVIDIA">
          <CompanyMark symbol="NVDA" className="size-6" />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-lagoon text-[9px] font-bold">
            $
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] font-semibold text-navy">Borrow {fmt(PRINCIPAL)} USDG</p>
          <p className="truncate text-[13px] text-fog">
            Against {COLLATERAL_UNITS} NVDA · 30 days<span className="hidden sm:inline"> · example #0428</span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-leaf-soft py-1 pl-1.5 pr-2.5 text-[12px] font-semibold text-leaf-deep">
          <span className="flex size-4 items-center justify-center rounded-full bg-leaf text-white">
            <Check className="size-2.5" strokeWidth={3.5} aria-hidden="true" />
          </span>
          Filled
        </span>
      </div>

      {/* The rate, front and centre, and how safe the loan is */}
      <div className="rounded-[22px] bg-[linear-gradient(150deg,#e9f8f7_0%,#eef6fb_100%)] px-5 pb-5 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-tide">Fixed rate</p>
            <p className="readout mt-1 font-display text-[44px] leading-none text-navy">
              {blendedApr.toFixed(2)}
              <span className="text-[24px] text-tide">% APR</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-medium text-tide">Health</p>
            <p className="readout mt-1 inline-flex items-center gap-1.5 font-display text-[26px] leading-none text-leaf-deep">
              <ShieldCheck className="size-5" aria-hidden="true" />
              {healthFactor.toFixed(2)}
            </p>
          </div>
        </div>

        {/* LTV meter with the tier ceiling and the liquidation line marked */}
        <div className="mt-6">
          <div className="relative h-2.5 rounded-full bg-white/80">
            <div
              className="animate-fill absolute inset-y-0 left-0 origin-left rounded-full bg-[linear-gradient(90deg,#14b7ad,#0a8782)]"
              style={{ width: onMeter(ltv), animationDelay: "0.3s" }}
            />
            <span className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-tide/40" style={{ left: onMeter(MAX_LTV) }} aria-hidden="true" />
            <span className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-rose/70" style={{ left: onMeter(LIQ_LTV) }} aria-hidden="true" />
          </div>
          <div className="relative mt-2.5 h-4 text-[12px]">
            <span className="absolute left-0 font-semibold text-navy">LTV {(ltv * 100).toFixed(1)}%</span>
            <span className="absolute -translate-x-1/2 whitespace-nowrap text-fog" style={{ left: onMeter(MAX_LTV) }}>
              Max {Math.round(MAX_LTV * 100)}%
            </span>
            <span className="absolute -translate-x-1/2 whitespace-nowrap text-rose-deep" style={{ left: onMeter(LIQ_LTV) }}>
              Liq. {Math.round(LIQ_LTV * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* The syndicate: who funded it, how much, at what rate */}
      <div className="px-4 pb-2 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-semibold text-navy">{SLICES.length} lenders funded this</p>
          <p className="text-[12.5px] text-fog">Each holds a slice token</p>
        </div>

        <ul className="mt-3 space-y-1">
          {SLICES.map((slice, i) => (
            <li
              key={slice.lender}
              className="animate-reveal flex items-center gap-3 rounded-2xl px-1 py-2 transition-colors hover:bg-haze"
              style={{ animationDelay: `${0.5 + i * 0.25}s` }}
            >
              <Blockie address={slice.address} className="size-9 shrink-0 ring-2 ring-white" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="readout truncate text-[13.5px] text-tide">{slice.lender}</span>
                  <span className="readout whitespace-nowrap text-[14px] font-semibold text-navy">{fmt(slice.amount)} USDG</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-haze-2">
                    <div
                      className="animate-fill h-full origin-left rounded-full bg-aqua/70"
                      style={{ width: `${(slice.amount / PRINCIPAL) * 100}%`, animationDelay: `${0.6 + i * 0.25}s` }}
                    />
                  </div>
                  <span className="readout rounded-full bg-lagoon-soft px-2 py-0.5 text-[11.5px] font-semibold text-lagoon-deep">
                    {slice.apr.toFixed(2)}%
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-2 mb-2 mt-2 flex items-center justify-between rounded-2xl bg-haze px-4 py-3 text-[12.5px]">
        <span className="readout text-fog">Settled in one transaction</span>
        <span className="inline-flex items-center gap-1 font-medium text-lagoon-deep">
          View on Blockscout <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

