import { Check } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";

const SIDES = [
  {
    n: "01",
    label: "Borrowers",
    title: "Cash without selling a share",
    body: "Connect with Robinhood Wallet, or with any EVM wallet, select the Stock Tokens to pledge, and read off how much each LTV tier lets you borrow next to an indicative rate taken from the live book.",
    points: [
      "Fills come in one lender at a time inside your Launch window",
      "Margin alerts reach you well before a liquidation is near",
      "Top up collateral, repay a portion or open a rollover from a single screen",
      "Dividends and splits are handled inside the token itself",
    ],
  },
  {
    n: "02",
    label: "Lenders",
    title: "Set the price of your own risk",
    body: "Sort open requests by APR, term, LTV and collateral. One click signs an offer, with no gas to pay. Standing offers can cover an entire tier, so borrowers always find a live book waiting.",
    points: [
      "Each slice token reports its accrued interest, health factor and maturity",
      "Unmatched USDG waits inside a Morpho USDG vault, earning while it waits",
      "Opt in to receive the collateral in kind when a loan liquidates",
      "Your exposure is confined to your slice and never pooled",
    ],
  },
  {
    n: "03",
    label: "Everyone",
    title: "A loan book open to inspection",
    body: "The Explorer lists every loan with its collateral, the oracle price at origination, the rate, the syndicate, repayment status and any liquidation history, and each entry links to its transaction on Blockscout.",
    points: [
      "How LTV is distributed and where it concentrates by token",
      "A bad debt ledger whose target is zero",
      "Realised liquidation prices set against the oracle",
      "Every parameter change and the reason behind it",
    ],
  },
] as const;

export function MarketSidesSection() {
  return (
    <section id="market" className="relative scroll-mt-28 bg-white py-20 md:py-28">
      <div className="container">
        <SectionHeading
          index="02"
          label="Market"
          title={
            <>
              Two sides to every loan, and a public <span className="accent-word">record</span> for anyone watching.
            </>
          }
          description="There is no utilisation curve on Spatial. A borrower states the most they will pay, each lender states the least they will take, and the contract settles wherever the two overlap."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {SIDES.map((side, i) => (
            <article key={side.title} className={`card card-tint card-hover animate-reveal delay-${i + 1} flex flex-col p-7`}>
              <div className="flex items-center justify-between">
                <p className="eyebrow">{side.label}</p>
                <span className="index">{side.n}</span>
              </div>
              <h3 className="mt-5 text-[24px] font-bold leading-tight md:text-[26px]">{side.title}</h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-tide">{side.body}</p>
              <ul className="mt-6 space-y-3 border-t border-line-soft pt-6 text-[15px] leading-snug text-tide">
                {side.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-[2px] inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-lagoon shadow-sm"
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
