import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { LoanTicket } from "@/components/LoanTicket";
import { TokenAddress } from "@/components/TokenAddress";
import { SITE } from "@/lib/site";

const PROOF = [
  { value: "7 to 90", unit: "day terms", note: "Fixed at origination" },
  { value: "0", unit: "pooled risk", note: "Every slice stands alone" },
  { value: "45", unit: "min auctions", note: "Recovery by contract, not court" },
] as const;

export function HeroSection() {
  return (
    <section className="relative -mt-[72px] px-2 pt-2 md:px-3 md:pt-3">
      {/* The sky, framed as one large rounded panel */}
      <div className="relative isolate overflow-hidden rounded-[28px] md:rounded-[36px]">
        <Image
          src="/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[50%_35%]"
        />
        <div aria-hidden="true" className="sky-veil absolute inset-0 -z-10" />
        <div aria-hidden="true" className="grain -z-10 opacity-[0.06]" />

        <div className="container flex flex-col items-center pb-10 pt-[148px] text-center md:pb-14 md:pt-[184px]">
          <Link
            href="#chain"
            className="animate-reveal glass-sky group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-lagoon-deep">
              <span className="live-dot" aria-hidden="true" />
              Live
            </span>
            Lending on Robinhood Chain
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>

          <h1 className="animate-reveal delay-1 mt-8 max-w-[920px] text-[44px] leading-[1.02] text-white md:text-[68px] lg:text-[80px] [text-wrap:balance]">
            Unlock cash from your stocks. Set your own rate to lend.
          </h1>
          <p className="animate-reveal delay-2 mt-6 max-w-[620px] text-[16.5px] leading-[1.65] text-white/85 md:text-[18px]">
            Spatial is one order book where people holding tokenized stocks meet people holding USDG. Borrowers pledge Stock
            Tokens and name the most they will pay, lenders each fund a slice at the rate they choose, and every fill lands
            on-chain.
          </p>

          <div className="animate-reveal delay-3 mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link href={SITE.appHref} className="btn btn-light btn-lg">
              Launch the app
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="#mechanics" className="btn btn-clear btn-lg">
              Follow one loan through
            </Link>
          </div>
          <p className="animate-reveal delay-3 mt-5 flex items-center gap-2 text-[12.5px] text-white/90 [text-shadow:0_1px_8px_rgb(3_60_90/0.6)]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Open-source contracts, bytecode verified on Blockscout, escrow with no administrator.
          </p>
          <TokenAddress address={SITE.tokenAddress} className="animate-reveal delay-4 mt-5" />

          {/* The product, floating in the clouds, with three figures on glass beside it */}
          <div className="animate-reveal delay-4 relative mt-14 w-full max-w-[560px] md:mt-20">
            <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[40px] bg-white/25 blur-2xl" />
            <LoanTicket className="text-left shadow-[0_40px_80px_-30px_rgb(3_60_90/0.55)]" />

            <dl className="mt-4 grid grid-cols-3 gap-2 text-left lg:absolute lg:-left-[248px] lg:top-10 lg:mt-0 lg:w-[220px] lg:grid-cols-1 lg:gap-3">
              {PROOF.map((item) => (
                <div key={item.unit} className="glass rounded-2xl px-4 py-3.5">
                  <dt className="caption text-[10px]">{item.unit}</dt>
                  <dd className="readout mt-1 font-display text-[24px] leading-none text-navy md:text-[28px]">{item.value}</dd>
                  <dd className="mt-1 hidden text-[12px] leading-snug text-tide sm:block">{item.note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
