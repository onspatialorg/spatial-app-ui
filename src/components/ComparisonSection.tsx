import { Spark } from "@/components/atmosphere";
import { SectionHeading } from "@/components/SectionHeading";

const ROWS = [
  { label: "Rate", pooled: "Floats with utilisation", spatial: "Agreed per loan and held for the term" },
  { label: "Term", pooled: "None, the position runs until repaid", spatial: "Fixed, carried forward by rollover auction" },
  { label: "Collateral", pooled: "A short curated list with caps", spatial: "Any Stock Token with an oracle price; the long tail through LTVs that lenders set" },
  { label: "Risk sharing", pooled: "Spread across every depositor", spatial: "Contained to one slice and one syndicate" },
  { label: "Bad debt", pooled: "Everyone absorbs a share", spatial: "Lands on the lender who set the price" },
  { label: "Idle capital", pooled: "Earns whatever the pool pays", spatial: "Parked in a Morpho vault until it is matched, and then earns the P2P spread" },
  { label: "Recovery", pooled: "The pool sells into DEX liquidity", spatial: "A Dutch auction with a bounded floor, or the collateral passed to the lender in kind" },
] as const;

const HEAD = "caption";
const COLS = "md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)]";

export function ComparisonSection() {
  return (
    <section id="compare" className="relative scroll-mt-28 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          index="03"
          label="Compared with pools"
          title={
            <>
              Pools are built for the liquid few. Spatial is built for the <span className="accent-word">long tail</span>.
            </>
          }
          description="Morpho vaults, Aave Horizon and Kamino do the right job for collateral that is curated and deep. Stocks with a single name, DEX pools that are thin, weekends when the market is shut and the tokens of private companies do not fit that mould. Those loans need a price set per loan and a term that is fixed."
        />

        {/* One card for every width: a three column matrix from tablet up, stacked rows on a phone */}
        <div className="card mt-14 overflow-hidden">
          <div className={`hidden border-b border-line md:grid ${COLS}`}>
            <div className={`px-6 py-4 text-fog ${HEAD}`}>Compared on</div>
            <div className={`px-6 py-4 text-fog ${HEAD}`}>Pooled RWA money market</div>
            <div className={`bg-lagoon-soft px-6 py-4 text-lagoon ${HEAD}`}>Spatial</div>
          </div>
          <ul className="divide-y divide-line-soft">
            {ROWS.map((row) => (
              <li key={row.label} className={`grid ${COLS}`}>
                <div className="px-5 pt-5 font-heading text-[13px] font-bold text-navy md:px-6 md:py-5 md:text-[14px]">{row.label}</div>
                <div className="px-5 pt-3 text-[15px] leading-relaxed text-tide md:px-6 md:py-5 md:pt-5">
                  <span className={`mb-1 block text-fog md:hidden ${HEAD}`}>Pooled market</span>
                  {row.pooled}
                </div>
                <div className="mx-5 mb-5 mt-3 rounded-xl bg-lagoon-soft px-4 py-3.5 text-[15px] leading-relaxed text-navy md:m-0 md:rounded-none md:px-6 md:py-5">
                  <span className={`mb-1 block text-lagoon md:hidden ${HEAD}`}>Spatial</span>
                  {row.spatial}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 flex max-w-3xl gap-3 text-[14.5px] leading-relaxed text-tide">
          <Spark className="mt-[8px]" />
          <span>
            Spatial runs beside Morpho on Robinhood Chain and does not try to replace it. Unmatched capital is parked there, and
            Morpho is the liquidity backstop when a liquidation needs a buyer.
          </span>
        </p>
      </div>
    </section>
  );
}
