import { Gauge, Hourglass, Satellite, ShieldCheck, Split, TriangleAlert } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

type Tone = "lagoon" | "leaf" | "amber" | "muted";

const TIERS: ReadonlyArray<{
  tier: string;
  tone: Tone;
  name: string;
  examples: string;
  maxLtv: string;
  liqLtv: string;
  haircut: string;
  note: string;
}> = [
  {
    tier: "A",
    tone: "lagoon",
    name: "Index funds and mega-caps",
    examples: "SPY, QQQ, AAPL, MSFT, NVDA",
    maxLtv: "55%",
    liqLtv: "70%",
    haircut: "10 pts",
    note: "The deepest DEX pools on the chain",
  },
  {
    tier: "B",
    tone: "leaf",
    name: "Large single names",
    examples: "Roughly the 100 deepest tokens on the DEXs",
    maxLtv: "45%",
    liqLtv: "60%",
    haircut: "10 pts",
    note: "",
  },
  {
    tier: "C",
    tone: "amber",
    name: "The long tail",
    examples: "Any token with a live Chainlink feed",
    maxLtv: "30%",
    liqLtv: "45%",
    haircut: "15 pts",
    note: "Each lender opts in token by token",
  },
  {
    tier: "D",
    tone: "muted",
    name: "Nothing live to price it",
    examples: "Private-company tokens, where offered",
    maxLtv: "Negotiated",
    liqLtv: "None",
    haircut: "n/a",
    note: "No automatic liquidation, default at maturity only, professional lenders, still on the roadmap",
  },
];

const MECHANISMS = [
  {
    icon: Gauge,
    title: "One health factor, two lines",
    body: "Collateral value multiplied by the liquidation LTV, divided by the debt. Under 1.10 the borrower gets a warning and a prompt to add collateral. Under 1.00 any address may open the auction.",
  },
  {
    icon: Split,
    title: "A Dutch auction, never a market sell",
    body: "The price opens at oracle plus 3% and slides down to a floor across roughly 45 minutes. Arbitrageurs, authorised participants and the lenders in the loan can all bid.",
  },
  {
    icon: Hourglass,
    title: "Haircuts that follow the session",
    body: "With the market closed or the feed stale, every LTV ceiling drops by the tier's haircut and the auction floor cannot go below 85% of the last oracle print. A Friday close is a poor guide to Monday.",
  },
  {
    icon: Satellite,
    title: "Grace after a sequencer outage",
    body: "For one hour after the sequencer recovers, nobody can liquidate, which gives borrowers time to top up. The L1 delayed inbox reaches every function too, so no sequencer can block a repayment.",
  },
  {
    icon: TriangleAlert,
    title: "Guards on the oracle",
    body: "A zero or negative price is refused. Each session has its own staleness bound. A single jump beyond 25% pauses the market until it is cleared, and a corporate action pauses the token until the feed comes back.",
  },
  {
    icon: ShieldCheck,
    title: "Price the token in escrow, nothing else",
    body: "Spatial values exactly the token it holds, never a wrapper and never an exchange rate derived from one. Edel's wGOOGLx loss in July 2026 came from ignoring that rule.",
  },
] as const;

const PILL: Record<Tone, string> = {
  lagoon: "bg-lagoon-soft text-lagoon-deep",
  leaf: "bg-leaf-soft text-leaf-deep",
  amber: "bg-amber-soft text-amber-deep",
  muted: "bg-haze-2 text-tide",
};

function TierPill({ tier, tone }: { tier: string; tone: Tone }) {
  return (
    <span className={cn("inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2.5 font-mono text-[12.5px] font-medium leading-none", PILL[tone])}>
      {tier}
    </span>
  );
}

const CELL_LABEL = "caption text-fog";
const TH = "px-5 py-3.5 caption text-fog";

export function RiskSection() {
  return (
    <section id="telemetry" className="relative scroll-mt-28 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          index="05"
          label="Telemetry"
          title="More collateral than debt, marked by oracle, sold by auction."
          description="When a loan on Spatial goes wrong the contract runs an auction. No court, no collections agent. The only collateral admitted is liquid, on-chain and priced by a live feed, and tiers are set by liquidity and feed quality, not by how famous the ticker is."
        />

        {/* Tier cards, phone and small tablet */}
        <div className="mt-14 grid gap-3 sm:grid-cols-2 md:hidden">
          {TIERS.map((row) => (
            <div key={row.tier} className="card p-5">
              <div className="flex items-start gap-3">
                <TierPill tier={row.tier} tone={row.tone} />
                <div>
                  <div className="text-[16px] font-semibold leading-snug text-navy">{row.name}</div>
                  <div className="mt-0.5 text-[13.5px] text-fog">{row.examples}</div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line-soft pt-4">
                <div>
                  <dt className={CELL_LABEL}>Max LTV</dt>
                  <dd className="readout mt-1 font-mono text-[14px] text-navy">{row.maxLtv}</dd>
                </div>
                <div>
                  <dt className={CELL_LABEL}>Liq. LTV</dt>
                  <dd className="readout mt-1 font-mono text-[14px] text-navy">{row.liqLtv}</dd>
                </div>
                <div>
                  <dt className={CELL_LABEL}>Haircut</dt>
                  <dd className="readout mt-1 font-mono text-[14px] text-navy">{row.haircut}</dd>
                </div>
              </dl>
              {row.note && <p className="mt-3 text-[13.5px] leading-relaxed text-tide">{row.note}</p>}
            </div>
          ))}
        </div>

        {/* Tier table, tablet and up */}
        <div className="card scrollbar-none mt-14 hidden overflow-x-auto md:block">
          <table className="ledger w-full min-w-[820px] border-collapse text-left text-[15px]">
            <thead>
              <tr>
                <th scope="col" className={TH}>Tier</th>
                <th scope="col" className={TH}>Collateral</th>
                <th scope="col" className={TH}>Max LTV</th>
                <th scope="col" className={TH}>Liquidation LTV</th>
                <th scope="col" className={TH}>Closed-market haircut</th>
                <th scope="col" className={TH}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((row) => (
                <tr key={row.tier}>
                  <td className="px-5 py-4 align-top">
                    <TierPill tier={row.tier} tone={row.tone} />
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="text-[16px] font-semibold leading-snug text-navy">{row.name}</div>
                    <div className="mt-0.5 text-[13.5px] text-fog">{row.examples}</div>
                  </td>
                  <td className="readout px-5 py-4 align-top font-mono text-[14px] text-navy">{row.maxLtv}</td>
                  <td className="readout px-5 py-4 align-top font-mono text-[14px] text-navy">{row.liqLtv}</td>
                  <td className="readout px-5 py-4 align-top font-mono text-[14px] text-navy">{row.haircut}</td>
                  <td className="px-5 py-4 align-top text-[14.5px] text-tide">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-fog">
          Live parameters. Nothing here moves without passing the timelock, and each change is published.
        </p>

        {/* The six mechanisms */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MECHANISMS.map((item, i) => (
            <article key={item.title} className="card card-hover p-6">
              <div className="flex items-center justify-between">
                <span className="icon-tile">
                  <item.icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="index">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-[17px] font-semibold leading-snug">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-tide">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
