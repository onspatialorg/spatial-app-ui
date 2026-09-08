import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { XIcon } from "@/components/icons";
import { Rings } from "@/components/atmosphere";
import { SITE } from "@/lib/site";

export function CTASection() {
  return (
    <section className="px-2 pb-2 pt-8 md:px-3 md:pb-3 md:pt-12">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#e9f8f7_0%,#dbf0fa_45%,#f4f9fa_100%)] md:rounded-[36px]">
        <div aria-hidden="true" className="grain -z-10" />
        <div
          aria-hidden="true"
          className="absolute -right-40 -top-40 -z-10 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(150_224_222/0.7),transparent_65%)] blur-2xl"
        />

        <div className="container grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="text-center lg:text-left">
            <p className="eyebrow eyebrow-pill animate-reveal delay-1">The book is open</p>
            <h2 className="animate-reveal delay-1 mt-6 text-[38px] leading-[1.04] md:text-[56px] lg:text-[64px] [text-wrap:balance]">
              Name a rate, or pledge a stock. <span className="accent-word">Start in minutes.</span>
            </h2>
            <p className="animate-reveal delay-2 mx-auto mt-6 max-w-xl text-[16.5px] leading-relaxed text-tide md:text-[18px] lg:mx-0">
              Pledge Stock Tokens and draw USDG in a single transaction, or sign a lend offer and let the matching come to
              you. Verification takes minutes for either side, and each fill lands on Robinhood Chain where anyone can
              watch it.
            </p>
            <div className="animate-reveal delay-3 mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href={SITE.appHref} className="btn btn-primary btn-lg">
                Launch the app
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <a href={SITE.xUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
                <XIcon className="size-3.5" />
                Follow {SITE.xHandle}
              </a>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center">
            <Rings className="absolute inset-0 h-full w-full" />
            <Image
              src="/images/logo-mark-lg.png"
              alt=""
              width={520}
              height={520}
              className="animate-float mark-glow relative w-[44%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
