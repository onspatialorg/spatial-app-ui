import { LoanTicket } from "@/components/LoanTicket";
import { SectionHeading } from "@/components/SectionHeading";
import { Spark } from "@/components/atmosphere";
import { cn } from "@/lib/utils";

/*
 * The six stages a loan passes through, in order. Each card carries a short
 * tag with the one parameter a reader is most likely to look for.
 */
const STAGES = [
  {
    n: "01",
    title: "Request",
    tag: "Launch window",
    tone: "bg-haze text-fog",
    body: "The borrower pledges Stock Tokens, states the USDG they want, the top APR they will accept, a term between 7 and 90 days, and a Launch window by which the request has to fill.",
  },
  {
    n: "02",
    title: "Offer",
    tag: "No gas",
    tone: "bg-haze text-fog",
    body: "Lenders sign lend offers off-chain under EIP-712. Signing costs nothing, an offer can be withdrawn whenever the lender likes, and it either targets a single request or stands on the book for a whole tier, much like a limit order.",
  },
  {
    n: "03",
    title: "Settle",
    tag: "One transaction",
    tone: "bg-lagoon-soft text-lagoon",
    body: "A single transaction verifies each signature and each lender's eligibility, locks the collateral in escrow, draws USDG from every lender into the borrower's wallet, and mints one slice token for each lender.",
  },
  {
    n: "04",
    title: "Accrue",
    tag: "3 day floor",
    tone: "bg-leaf-soft text-leaf-deep",
    body: "Interest is simple, fixed, and counted per second. The borrower may repay at any moment. The only floor is a 3 day minimum interest period, so a loan closed on its first day still pays three days of interest.",
  },
  {
    n: "05",
    title: "Rollover",
    tag: "Rising rate",
    tone: "bg-amber-soft text-amber-deep",
    body: "Ahead of maturity the borrower can open a rollover auction. The rate starts at the loan's blended APR and climbs toward a cap; lenders who accept fund the new term, the old syndicate is repaid on-chain, and the term ends without a cliff.",
  },
  {
    n: "06",
    title: "Liquidate",
    tag: "45 minutes",
    tone: "bg-rose-soft text-rose-deep",
    body: "Should the health factor drop under 1.0, anyone may open a Dutch auction on the collateral that runs for 45 minutes. Proceeds cover the keeper's share first, then the lenders, and whatever is left over is handed back to the borrower.",
  },
] as const;

const SYNDICATION = [
  "Lenders of any size can hold a slice of a loan that would otherwise need an institution.",
  "A borrower is filled in full without depending on a single large lender turning up.",
  "USDG that has not matched yet sits inside a Morpho USDG vault, earning until it is drawn.",
] as const;

export function HowItWorksSection() {
  return (
    <section id="mechanics" className="relative scroll-mt-28 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          index="01"
          label="Mechanics"
          title={
            <>
              Six steps from a <span className="accent-word">request</span> to a settled loan.
            </>
          }
          description="Every Spatial loan is a small syndicate. A borrower asks for 20,000 USDG against tokenized NVDA; three lenders or thirty fund it, each holding a slice at a rate they picked themselves. Slices never share a loss, so the lender who set the price is the one exposed to it."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          {/* The worked example stays in view while the stages scroll past it */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <LoanTicket />
            <div className="surface mt-6 p-5">
              <p className="eyebrow eyebrow-muted">Why syndicate</p>
              <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-tide">
                {SYNDICATION.map((point) => (
                  <li key={point} className="flex gap-3">
                    <Spark className="mt-[8px]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The six stages as numbered cards */}
          <ol className="grid gap-4 sm:grid-cols-2">
            {STAGES.map((stage, i) => (
              <li key={stage.title} className={cn("card card-hover animate-reveal flex flex-col p-6", `delay-${Math.min(i + 1, 5)}`)}>
                <div className="flex items-center justify-between gap-3">
                  <span className="readout inline-flex size-9 items-center justify-center rounded-[10px] bg-lagoon-soft font-mono text-[12px] font-medium text-lagoon">
                    {stage.n}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-1 caption", stage.tone)}>{stage.tag}</span>
                </div>
                <h3 className="mt-5 text-[22px] font-bold leading-tight md:text-[24px]">{stage.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-tide">{stage.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
