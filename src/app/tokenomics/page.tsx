import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Ban, Coins, Landmark, Lock, Repeat, Scale, ShieldCheck, Vote, Wallet } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { TokenAddress } from "@/components/TokenAddress";
import { Aurora, DotGrid, Rings, Spark } from "@/components/atmosphere";
import { SITE, docsHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tokenomics",
  description:
    "$SPATIAL has a fixed supply of 1 billion, no mint function and no emissions, with buybacks funded by protocol revenue. What the token is for, what it is not for, and where the income comes from.",
  alternates: { canonical: "/tokenomics" },
};

const FACTS = [
  { label: "Ticker", value: "$SPATIAL" },
  { label: "Network", value: "Robinhood Chain" },
  { label: "Chain ID", value: String(SITE.chainId) },
  { label: "Total supply", value: "1,000,000,000" },
  { label: "Mint function", value: "None" },
  { label: "Emissions", value: "None" },
] as const;

const SUPPLY = [
  {
    icon: Lock,
    title: "One billion, and that is all",
    body: "The whole supply exists already. No schedule releases more of it later and no formula expands it when the market is busy.",
  },
  {
    icon: Ban,
    title: "The contract cannot mint",
    body: "There is no mint function in the token contract, so a larger supply is not a decision anyone gets to take. You can read the verified source on Blockscout and confirm it.",
  },
  {
    icon: ShieldCheck,
    title: "Governance cannot mint either",
    body: "Parameter changes travel through a timelock and are published with their reason. Creating $SPATIAL is not among the things that process is able to do.",
  },
] as const;

const UTILITY = [
  {
    icon: Vote,
    title: "A vote on the parameters",
    body: "Tier limits, haircuts, fees and exposure caps are decided by $SPATIAL holders. A proposal that passes goes through the timelock and takes effect with its reason published beside it.",
  },
  {
    icon: Landmark,
    title: "Direction of protocol income",
    body: "Fees pay for audits, the bug bounty and daily operations. How the rest is put to work is a decision holders make together.",
  },
  {
    icon: Repeat,
    title: "Buybacks funded by revenue",
    body: "A portion of the fees the protocol earns buys $SPATIAL back. The money comes from real lending activity, so buybacks grow as the market grows.",
  },
  {
    icon: Scale,
    title: "Guardrails that do not move",
    body: "Whatever holders decide, three things stay fixed: the timelock, the published reason for each change, and the rule that repayment can never be paused.",
  },
] as const;

const NOT_FOR = [
  {
    icon: Coins,
    title: "It does not subsidise rates",
    body: "Every rate on Spatial is agreed between a borrower and the lenders funding the loan. No yield is topped up with token rewards, so a quoted APR is the APR.",
  },
  {
    icon: Wallet,
    title: "It is not a ticket to borrow or lend",
    body: "Loans are denominated in USDG and secured by Stock Tokens, and fees are collected in USDG. Holding $SPATIAL is not a condition for using the market.",
  },
  {
    icon: ShieldCheck,
    title: "It does not hold the protocol up",
    body: "Spatial earns from four fees charged when real work is done. The market would run on those same fees with or without the token.",
  },
] as const;

const FEES = [
  { stream: "Origination", payer: "Borrower", rate: "0.25% of principal" },
  { stream: "Interest share", payer: "Lender, taken from the payout", rate: "10% of interest paid" },
  { stream: "Rollover", payer: "Borrower", rate: "0.10% of principal" },
  { stream: "Liquidation penalty", payer: "Borrower in default", rate: "3 points: one to the keeper, two shared by lenders and the protocol" },
  { stream: "Parked capital yield share", payer: "Lender", rate: "5% of yield, on the roadmap" },
] as const;

/**
 * Allocation of the supply. Left empty until the figures are published; the section
 * renders only when this list has entries. Shares are percentages of total supply.
 */
const ALLOCATION: ReadonlyArray<{ bucket: string; share: number; note: string }> = [];

const CELL_HEAD = "eyebrow eyebrow-plain text-[10px]";

export default function TokenomicsPage() {
  return (
    <div className="relative">
      <Header />
      <main>
        {/* Opening: centred, with the facts as one strip beneath */}
        <section className="relative isolate -mt-[72px] overflow-hidden pt-[72px]">
          <Aurora />
          <DotGrid />
          <div
            className="pointer-events-none absolute left-1/2 top-[46%] -z-10 w-[620px] -translate-x-1/2 -translate-y-1/2 opacity-60 md:w-[820px]"
            aria-hidden="true"
          >
            <Rings className="h-auto w-full" />
          </div>

          <div className="container relative pb-16 pt-14 md:pb-24 md:pt-24">
            <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
              <h1 className="animate-reveal delay-1 mt-6 text-[42px] leading-[1.05] md:text-[64px] lg:text-[76px] [text-wrap:balance]">
                $SPATIAL Tokenomics
                <span className="accent-word block">Powering the protocol and ecosystem</span>
              </h1>
              <p className="animate-reveal delay-2 mt-7 max-w-[600px] text-[16px] leading-[1.65] text-tide md:text-[17px]">
                $SPATIAL is the token of the Spatial protocol on Robinhood Chain. Holders vote on the parameters the market runs on, and a portion of the fees the
                protocol earns is used to buy the token back.
              </p>
              <div className="animate-reveal delay-3 mt-8">
                <TokenAddress address={SITE.tokenAddress} />
              </div>
              <div className="animate-reveal delay-3 mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                <Link href={SITE.appHref} className="btn btn-primary btn-lg">
                  Launch the app
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
                <a href={docsHref("resources/revenue")} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
                  Read how Spatial earns
                </a>
              </div>
              <p className="animate-reveal delay-4 mt-5 flex items-center gap-2 text-[12.5px] text-fog">
                <ShieldCheck className="size-3.5 text-lagoon" aria-hidden="true" />
                Verified source on Blockscout. Fixed supply, no mint function.
              </p>
            </div>
          </div>
        </section>

        {/* Supply */}
        <section id="supply" className="relative scroll-mt-28 bg-white py-20 md:py-28">
          <div className="container">
            <SectionHeading
              index="01"
              label="Supply"
              title={
                <>
                  The number is settled, and <span className="accent-word">nobody holds the pen.</span>
                </>
              }
              description="A token whose supply can grow is a promise that depends on restraint. $SPATIAL removes the question. The supply was fixed when the contract was deployed and the contract offers no route to change it."
            />
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {SUPPLY.map((item, i) => (
                <article key={item.title} className="card card-tint card-hover p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-lagoon shadow-sm">
                      <item.icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="index">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[18px] leading-snug">{item.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-tide">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Allocation, shown once figures are published */}
        {ALLOCATION.length > 0 && (
          <section id="allocation" className="relative scroll-mt-28 py-20 md:py-28">
            <div className="container">
              <SectionHeading
                index="02"
                label="Allocation"
                title="Where the billion sits."
                description="Each share of the supply, who holds it and on what terms."
              />
              <div className="card mt-14 overflow-hidden">
                <ul>
                  {ALLOCATION.map((row) => (
                    <li key={row.bucket} className="grid gap-3 border-b border-line-soft px-6 py-5 last:border-b-0 md:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_auto] md:items-center">
                      <div>
                        <p className="text-[15px] font-semibold text-navy">{row.bucket}</p>
                        <p className="mt-0.5 text-[13.5px] text-tide">{row.note}</p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-haze-2">
                        <div className="h-full rounded-full bg-lagoon" style={{ width: `${row.share}%` }} />
                      </div>
                      <p className="readout text-[15px] font-medium text-navy md:text-right">{row.share}%</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Utility */}
        <section id="utility" className="relative scroll-mt-28 py-20 md:py-28">
          <div className="container">
            <SectionHeading
              index={ALLOCATION.length > 0 ? "03" : "02"}
              label="Utility"
              title={
                <>
                  Tied to governance and revenue, <span className="accent-word">not to emissions.</span>
                </>
              }
              description="The token has two jobs. It gives holders a say in how the protocol is run, and it ties them to what the protocol earns through buybacks paid for by fees."
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {UTILITY.map((item, i) => (
                <article key={item.title} className="card card-hover flex flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span className="icon-tile">
                      <item.icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="index">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[18px] leading-snug">{item.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-tide">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* What it is not for */}
        <section id="limits" className="relative scroll-mt-28 bg-haze py-20 md:py-28">
          <div className="container">
            <SectionHeading
              index={ALLOCATION.length > 0 ? "04" : "03"}
              label="Limits"
              title={
                <>
                  Three things the token <span className="accent-word">will not be used for.</span>
                </>
              }
              description="Tokens have been used to rent liquidity, to gate products and to hide thin economics. Spatial is set up so that none of those is available."
            />
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {NOT_FOR.map((item, i) => (
                <article key={item.title} className="card card-hover p-6">
                  <div className="flex items-center justify-between">
                    <span className="icon-tile">
                      <item.icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="index">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-[18px] leading-snug">{item.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-tide">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Income */}
        <section id="income" className="relative scroll-mt-28 py-20 md:py-28">
          <div className="container">
            <SectionHeading
              index={ALLOCATION.length > 0 ? "05" : "04"}
              label="Protocol income"
              title={
                <>
                  Income comes from fees, <span className="accent-word">charged where work is done.</span>
                </>
              }
              description="Four fees are live and a fifth is on the roadmap. Each is a published parameter, collected in USDG at the moment value changes hands, and none is hidden inside a quoted rate."
            />

            {/* Stacked rows on a phone */}
            <div className="mt-14 grid gap-3 md:hidden">
              {FEES.map((fee) => (
                <div key={fee.stream} className="card p-5">
                  <p className="text-[15px] font-semibold text-navy">{fee.stream}</p>
                  <p className="readout mt-2 text-[14.5px] text-lagoon">{fee.rate}</p>
                  <p className="mt-1 text-[13px] text-fog">Paid by: {fee.payer}</p>
                </div>
              ))}
            </div>

            {/* Table from tablet up */}
            <div className="card mt-14 hidden overflow-hidden md:block">
              <table className="ledger w-full border-collapse text-left text-[14.5px]">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-4"><span className={CELL_HEAD}>Fee</span></th>
                    <th scope="col" className="px-6 py-4"><span className={CELL_HEAD}>Paid by</span></th>
                    <th scope="col" className="px-6 py-4"><span className={CELL_HEAD}>Rate</span></th>
                  </tr>
                </thead>
                <tbody>
                  {FEES.map((fee) => (
                    <tr key={fee.stream}>
                      <td className="px-6 py-4 align-top font-semibold text-navy">{fee.stream}</td>
                      <td className="px-6 py-4 align-top text-tide">{fee.payer}</td>
                      <td className="readout px-6 py-4 align-top text-lagoon">{fee.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 flex max-w-3xl items-start gap-3 text-[13.5px] leading-relaxed text-fog">
              <Spark className="mt-[7px]" />
              That income funds audits, the bug bounty and the running of the service, and a portion of it buys
              $SPATIAL back.
            </p>
          </div>
        </section>

        {/* Closing */}
        <section className="relative isolate overflow-hidden">
          <Aurora />
          <div className="container flex flex-col items-center pb-24 pt-20 text-center md:pb-32 md:pt-28">
            <p className="eyebrow">Take part</p>
            <h2 className="mt-6 max-w-3xl text-[34px] leading-[1.08] md:text-[52px] [text-wrap:balance]">
              Hold the token. <span className="accent-word">Help steer the market.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-tide">
              $SPATIAL holders set the parameters the market runs on and share in its growth through buybacks. The
              source is verified on Blockscout and every fee is public. Nothing here is investment advice.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <a href={SITE.docsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                Open the docs
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
              <Link href="/" className="btn btn-secondary btn-lg">
                Back to the front page
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
