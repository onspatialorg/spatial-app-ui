import { Blocks, CircleDollarSign, Fingerprint, Network, Radio, Zap } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Aurora } from "@/components/atmosphere";

const FACTS = [
  { label: "Chain ID", value: "4663" },
  { label: "Stack", value: "Arbitrum Nitro" },
  { label: "Settlement layer", value: "Ethereum" },
  { label: "Mainnet live", value: "1 Jul 2026" },
  { label: "Median tx cost", value: "$0.001" },
] as const;

const FEATURES = [
  {
    icon: Blocks,
    title: "Stock Tokens with no strings attached",
    body: "AAPL, NVDA, SPY and the rest arrive as ordinary ERC-20s from a listed broker, each one matched by a share held in custody. You hold them yourself, transfers carry no hooks, and ERC-8056 handles dividends and splits within the token.",
  },
  {
    icon: Radio,
    title: "Chainlink prices around the clock, five days a week",
    body: "Data Feeds drive the health checks, Data Streams price the auctions, a market status flag tells the contract when the session is closed, and the Sequencer Uptime Feed turns an outage into a planned pause instead of a surprise.",
  },
  {
    icon: CircleDollarSign,
    title: "Settled in USDG",
    body: "Paxos issues the Global Dollar natively here, the EU regulates it under MiCA, and Robinhood Earn lends it today. A USDe or USDC market can follow later as its own isolated configuration.",
  },
  {
    icon: Zap,
    title: "Quick blocks, tiny fees",
    body: "A block lands every 250 ms, preconfirmations come back in 100 ms, and a typical transaction costs a tenth of a cent. A fill or a liquidation is final long before the price can move away from it.",
  },
  {
    icon: Fingerprint,
    title: "Smart accounts as standard",
    body: "ERC-4337 and EIP-7702 are both live on the chain. Lenders sign offers with no gas, a borrower can approve and borrow in a single step, and contract wallets are verified through EIP-1271.",
  },
  {
    icon: Network,
    title: "Liquidity next door",
    body: "Uniswap, 1inch and Morpho Blue are already live here. Unmatched lender balances sit in a Morpho vault for USDG and keep earning, and when an auction opens there are arbitrageurs ready to bid.",
  },
] as const;

export function ChainSection() {
  return (
    <section id="chain" className="relative isolate scroll-mt-28 overflow-hidden bg-haze py-20 md:py-28">
      <Aurora faint />
      <div className="container">
        <SectionHeading
          index="04"
          label="Robinhood Chain"
          title={
            <>
              Built where a broker puts <span className="accent-word">real stocks</span> on-chain.
            </>
          }
          description="No other L2 gives you tokenized equities as plain ERC-20s, Chainlink feeds for every one of them, open deployment and a broker's own customer base in the same place. Spatial runs here because a lending market needs all four at once."
        />

        {/* Spec strip */}
        <dl className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {FACTS.map((fact, i) => (
            <div key={fact.label} className={`animate-reveal delay-${Math.min(i + 1, 5)} card px-5 py-4`}>
              <dt className="caption text-fog">{fact.label}</dt>
              <dd className="readout mt-2 font-mono text-[19px] font-medium text-navy md:text-[21px]">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {/* What the chain gives a lending market */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <article key={feature.title} className="card card-hover flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="icon-tile">
                  <feature.icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="index">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-[17px] font-semibold leading-snug">{feature.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-tide">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
