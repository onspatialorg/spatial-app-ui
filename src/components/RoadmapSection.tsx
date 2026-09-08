import { SectionHeading } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

type Milestone = {
  name: string;
  body: string;
  detail?: string;
  status: "live" | "next";
};

const LIVE: Milestone[] = [
  {
    name: "Tier A and tier B collateral on Robinhood Chain",
    body: "Stock Tokens from the index, mega-cap and large-cap tiers, borrowed against in USDG, with terms fixed anywhere between 7 and 90 days. Standing offers, targeted offers, rollover auctions, parked capital and the Explorer are all running.",
    detail: "Open to professional lenders and verified borrowers. Exposure is capped per token, and every parameter change passes through the timelock.",
    status: "live",
  },
  {
    name: "The risk engine",
    body: "Haircuts that follow the trading session, Dutch auctions whose floor is bounded while markets are closed, liquidation in kind, a grace period once the sequencer returns, and oracle pricing on the exact token pledged.",
    detail: "Each liquidation, with the price it realised against the oracle, is listed on Telemetry.",
    status: "live",
  },
];

const NEXT: Milestone[] = [
  {
    name: "Long-tail collateral",
    body: "Tier C Stock Tokens that carry a live Chainlink feed, opened one market at a time as DEX depth and auction history justify it. After that, negotiated tier D loans, professionals only.",
    detail: "Caps follow the evidence rather than lead it.",
    status: "next",
  },
  {
    name: "Senior and junior slices",
    body: "Optional tranching inside one syndicate: lenders chasing more yield take the first loss, and senior slices are paid out ahead of them.",
    status: "next",
  },
  {
    name: "Tokenized treasuries and retail lenders",
    body: "Treasury and fund-share tokens bridged in as collateral, priced by NAV oracles, plus a secondary market where slice tokens trade, and lending for retail in each jurisdiction that permits it.",
    status: "next",
  },
  {
    name: "A governance module",
    body: "Parameter control passes from the foundation's multisig into a governance module. The timelock stays, the public rationale stays, and repayment stays impossible to pause.",
    status: "next",
  },
];

function StatusPill({ status }: { status: Milestone["status"] }) {
  const live = status === "live";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 caption",
        live ? "bg-leaf-soft text-leaf-deep" : "bg-haze-2 text-fog"
      )}
    >
      {live && <span className="live-dot" aria-hidden="true" />}
      {live ? "Live" : "Next"}
    </span>
  );
}

function MilestoneCard({ item, index, className }: { item: Milestone; index: number; className?: string }) {
  return (
    <li className={cn("card card-hover flex flex-col p-6", className)}>
      <div className="flex items-center justify-between">
        <StatusPill status={item.status} />
        <span className="index">0{index}</span>
      </div>
      <h3 className="mt-5 text-[19px] font-semibold leading-snug text-navy">{item.name}</h3>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-tide">{item.body}</p>
      {item.detail && (
        <div className="mt-auto pt-5">
          <p className="surface px-4 py-3 text-[13.5px] leading-relaxed text-tide">{item.detail}</p>
        </div>
      )}
    </li>
  );
}

export function RoadmapSection() {
  return (
    <section id="roadmap" className="relative scroll-mt-28 bg-haze py-20 md:py-28">
      <div className="container">
        <SectionHeading
          index="08"
          label="Roadmap"
          title="Running today, and the four steps after it."
          description="Spatial opened with cautious LTVs, a visible cap on every token and a risk page anyone can read. Each later milestone unlocks only once the figures from the previous one support it."
        />

        {/* Row one: what is live. Row two: what follows, in order. */}
        <div className="mt-14 space-y-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="live-dot" aria-hidden="true" />
              <h3 className="caption text-fog">On mainnet now</h3>
              <span className="rule h-px flex-1" aria-hidden="true" />
            </div>
            <ol className="mt-5 grid gap-4 md:grid-cols-2">
              {LIVE.map((item, i) => (
                <MilestoneCard key={item.name} item={item} index={i + 1} className="animate-reveal delay-1" />
              ))}
            </ol>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full border border-fog bg-haze" aria-hidden="true" />
              <h3 className="caption text-fog">Queued, in order</h3>
              <span className="rule h-px flex-1" aria-hidden="true" />
            </div>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {NEXT.map((item, i) => (
                <MilestoneCard key={item.name} item={item} index={LIVE.length + i + 1} className="animate-reveal delay-2" />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
