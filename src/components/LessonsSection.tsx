import { SectionHeading } from "@/components/SectionHeading";
import { Spark } from "@/components/atmosphere";

const PRECEDENTS = [
  {
    event: "Maple and Orthogonal Trading",
    when: "Dec 2022",
    loss: "$36M",
    what: "Close to 30% of everything Maple had lent. Orthogonal had FTX exposure it kept quiet until the money was gone.",
    lesson: "An unsecured line to a counterparty you cannot audit is a bet, not a loan. On Spatial the contract holds more collateral than debt on every position.",
  },
  {
    event: "Goldfinch",
    when: "2023 to 2026",
    loss: "$18M",
    what: "Tugende, Stratos and Lend East all failed to pay. GFI lost 99.8% of its value and the protocol was put into maintenance mode.",
    lesson: "A chain cannot enforce a covenant, and chasing debt off-chain takes years and returns cents. Spatial recovers through liquidation, with no lawsuit in the path.",
  },
  {
    event: "Centrifuge ConsolFreight and Harbor",
    when: "2023",
    loss: "$4M",
    what: "Too much lent to too few obligors. Redemptions stayed frozen for months and Maker was among those exposed.",
    lesson: "Concentration does the damage. Caps per token and syndicates that share nothing keep one failed loan from locking anyone else's funds.",
  },
  {
    event: "Edel Finance and wGOOGLx",
    when: "Jul 2026",
    loss: "$403K",
    what: "The feed itself was accurate. The attack pushed a wrapper's exchange rate to 78 times where it belonged, and the protocol trusted it.",
    lesson: "Value the token in your custody and only that token. Spatial will not price a wrapper or anything derived from one.",
  },
] as const;

export function LessonsSection() {
  return (
    <section id="precedents" className="relative scroll-mt-28 bg-white py-20 md:py-28">
      <div className="container">
        <SectionHeading
          index="06"
          label="Precedents"
          title="Settlement moved on-chain. Credit risk stayed exactly where it was."
          description="Four failures from the previous round of RWA credit, with the money lost and the rule each one taught. Every one of those rules is written into the contracts."
        />

        <div className="scrollbar-none -mx-6 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {PRECEDENTS.map((item, i) => (
            <article
              key={item.event}
              className={`animate-reveal delay-${i + 1} card card-tint card-hover flex w-[300px] shrink-0 snap-start flex-col p-6 lg:w-auto`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="readout font-mono text-[30px] font-medium leading-none text-rose-deep">{item.loss}</span>
                <span className="caption text-fog">{item.when}</span>
              </div>
              <h3 className="mt-5 text-[17px] font-semibold leading-snug">{item.event}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-tide">{item.what}</p>
              <div className="mt-auto border-t border-line pt-4">
                <p className="flex items-center gap-2 caption text-lagoon">
                  <Spark />
                  The rule it left us
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-navy">{item.lesson}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
