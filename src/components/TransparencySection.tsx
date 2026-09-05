import { SectionHeading } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

const DELAYS = ["delay-1", "delay-2", "delay-3", "delay-4"] as const;

const COMMITMENTS = [
  {
    title: "Each state change emits an event",
    body: "A fill, a repayment, a rollover, an auction opening or settling, a parameter update: all of them land on-chain, and the explorer links every one to its Blockscout transaction.",
  },
  {
    title: "The loan book is public",
    body: "Every open loan with its collateral, LTV, rate, term, the number of lenders in the syndicate, its health factor and the oracle price recorded at origination.",
  },
  {
    title: "The risk page is public",
    body: "Telemetry shows the LTV distribution across the protocol, concentration per token, the ledger of bad debt, and each liquidation with its realised price next to the oracle.",
  },
  {
    title: "Oracle and reserve status, live",
    body: "For each token: the current Chainlink price, session state, staleness and multiplier. Where the issuer publishes a proof of reserve feed, that is shown as well.",
  },
  {
    title: "A governance log with reasons",
    body: "Each timelock proposal and its execution appears in the log together with the rationale behind it, before anything takes effect.",
  },
  {
    title: "Open source, bytecode verified",
    body: "The contracts, the relayer, the indexer and the keeper bots ship under a permissive licence. Builds are reproducible and the deployed bytecode is verified.",
  },
  {
    title: "No order flow is hidden",
    body: "The off-chain book exports in full. Run your own relayer and you will see the same offers as everyone else.",
  },
  {
    title: "Nothing held before a match",
    body: "Funds only move at settlement, against an approval you granted beforehand. Repayment and withdrawal cannot be paused by anyone.",
  },
] as const;

export function TransparencySection() {
  return (
    <section id="explorer" className="relative scroll-mt-28 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          index="07"
          label="Explorer"
          title={
            <>
              Solvency comes first. <span className="accent-word">Proof</span> anyone can check comes right after.
            </>
          }
          description="A market earns trust through what a stranger can confirm about it without asking. Spatial ships with these eight commitments, and the Explorer is where each one stays in view."
        />

        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COMMITMENTS.map((item, i) => (
            <li key={item.title} className={cn("card card-hover animate-reveal flex flex-col p-6", DELAYS[i % DELAYS.length])}>
              <div className="flex items-center justify-between">
                <span className="index">0{i + 1}</span>
                <span className="size-2 rounded-full bg-lagoon/60" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-[16.5px] font-semibold leading-snug text-navy">{item.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-tide">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
