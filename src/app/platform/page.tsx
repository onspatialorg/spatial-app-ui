"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, Coins, HandCoins, Telescope } from "lucide-react";
import { useSession } from "@/components/platform/PlatformProviders";
import { useMarketData } from "@/components/platform/usePlatformData";
import { Address, Badge, Console, ConsoleHeader, EmptyState, LtvGauge, Notice, Panel, PanelHeader, Skeleton } from "@/components/platform/ui";
import { TokenAvatar } from "@/components/TokenAvatar";
import { fmtBps, fmtCompact, fmtCountdown, fmtMoney, fmtTerm } from "@/lib/platform/format";
import { indicativeRate, num } from "@/lib/platform/math";

const DOORS = [
  {
    href: "/platform/borrow",
    icon: HandCoins,
    eyebrow: "Borrowers",
    title: "Cash against your Stock Tokens",
    body: "Pledge collateral, name the highest APR you will accept, and let lenders fill the request one slice at a time.",
  },
  {
    href: "/platform/lend",
    icon: Coins,
    eyebrow: "Lenders",
    title: "Your rate, your slice",
    body: "Sign a standing or targeted offer for free. Each slice you fund stands on its own, with no shared loss pool behind it.",
  },
  {
    href: "/platform/explorer",
    icon: Telescope,
    eyebrow: "Anyone",
    title: "The Explorer",
    body: "Every loan, slice and event on the chain, shown next to the parameters that governed it.",
  },
] as const;

const tierTone = (tier: number) => (tier === 1 ? "lagoon" : tier === 2 ? "leaf" : "amber");

export default function OverviewPage() {
  const { authenticated, login } = useSession();
  const { data, loading, error, marketById } = useMarketData();

  const settlementAsset = data?.config.chain.settlement_asset || data?.markets[0]?.loan_symbol || "";
  const bookCoverage = data ? Math.min(100, (num(data.stats?.open_lend_capacity) / Math.max(num(data.stats?.open_demand), 1)) * 100) : 0;
  const liquidations = data?.stats?.liquidations ?? 0;
  const term = data ? (data.config.terms.includes(2_592_000) ? 2_592_000 : data.config.terms[0]) : 0;

  return (
    <>
      <ConsoleHeader
        variant="sky"
        eyebrow="Overview"
        title="A live view of the book."
        description="Requests, offers and loans on this page come straight from the shared order book as it stands right now. No cache sits in front of it, and the Explorer shows the same records to anyone who looks."
        action={
          !authenticated ? (
            <button type="button" onClick={login} className="btn btn-light cursor-pointer">
              Sign in to take part
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <Link href="/platform/borrow" className="btn btn-light">
              New borrow request
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          )
        }
        stats={[
          {
            label: "Outstanding principal",
            value: data ? fmtCompact(data.stats?.outstanding_principal, settlementAsset) : "…",
            hint: data ? `${data.stats?.active_loans ?? 0} loans running` : undefined,
          },
          {
            label: "Open lend capacity",
            value: data ? fmtCompact(data.stats?.open_lend_capacity, settlementAsset) : "…",
            hint: data ? `${data.stats?.open_offers ?? 0} offers on the book, standing and targeted` : undefined,
            accent: "lagoon",
          },
          {
            label: "Open demand",
            value: data ? fmtCompact(data.stats?.open_demand, settlementAsset) : "…",
            hint: data ? `${data.stats?.open_requests ?? 0} requests waiting, ${bookCoverage.toFixed(0)}% covered by offers` : undefined,
          },
          {
            label: "Liquidations",
            value: data ? String(liquidations) : "…",
            hint: data ? `${data.stats?.repaid_loans ?? 0} repaid in full, bad debt 0` : undefined,
            accent: data ? (liquidations > 0 ? "rose" : "leaf") : undefined,
          },
        ]}
      />

      <Console className="space-y-6">
        {error && <Notice tone="error">{error}</Notice>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Panel>
            <PanelHeader
              eyebrow="Markets"
              title="Collateral, limits and indicative APR"
              description={`Tier ceilings and prices are read from the protocol configuration. The indicative APR is the cheapest open offer with capacity left at ${term ? fmtTerm(term) : "the listed term"}.`}
            />
            {loading && !data ? (
              <Skeleton rows={4} />
            ) : data && data.markets.length === 0 ? (
              <EmptyState title="No markets yet" body="Seed them with supabase/seed.sql or insert rows into the markets table." />
            ) : (
              <ul className="space-y-2.5">
                {data?.markets.map((m) => {
                  const p = data.prices[m.id];
                  const rate = term ? indicativeRate(data.offers, m.id, m.tier, term) : null;
                  return (
                    <li key={m.id} className="rounded-[20px] border border-line-soft bg-canvas/50 p-4 transition-colors hover:border-lagoon-line hover:bg-white">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        <div className="flex min-w-[180px] flex-1 items-center gap-3">
                          <TokenAvatar symbol={m.collateral_symbol} size={40} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-semibold text-navy">{m.collateral_symbol}</span>
                              <Badge tone={tierTone(m.tier)}>Tier {m.tier_label}</Badge>
                            </div>
                            <div className="truncate text-[12.5px] text-fog">{m.collateral_name}</div>
                          </div>
                        </div>
                        <div className="w-[120px]">
                          {p ? (
                            <>
                              <div className="readout text-[15px] font-semibold text-navy">{fmtMoney(p.price, m.loan_symbol)}</div>
                              <div className="text-[12px] text-fog">{p.session.charAt(0).toUpperCase() + p.session.slice(1)} session</div>
                            </>
                          ) : (
                            <span className="text-[13px] text-fog">No feed yet</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-[12px] text-fog">From</div>
                          {rate === null ? (
                            <div className="text-[13px] font-medium text-fog">none open</div>
                          ) : (
                            <div className="readout font-display text-[20px] leading-none text-lagoon-deep">{fmtBps(rate)}</div>
                          )}
                        </div>
                      </div>
                      <LtvGauge limitsOnly ltvBps={0} maxBps={m.max_ltv_bps} liqBps={m.liq_ltv_bps} className="mt-4" />
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Open requests"
              title="Waiting on lenders"
              action={
                <Link href="/platform/lend" className="btn btn-secondary btn-sm">
                  See the book
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              }
            />
            {loading && !data ? (
              <Skeleton />
            ) : data && data.requests.length === 0 ? (
              <EmptyState title="Nothing is waiting right now" body="New borrow requests appear here the moment a borrower posts one." />
            ) : (
              <ul className="space-y-1">
                {data?.requests.slice(0, 6).map((r) => {
                  const m = marketById[r.market_id];
                  return (
                    <li key={r.id} className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-haze">
                      {m && <TokenAvatar symbol={m.collateral_symbol} size={36} />}
                      <div className="min-w-0 flex-1">
                        <div className="readout truncate text-[14px] font-semibold text-navy">{fmtMoney(r.principal, m?.loan_symbol ?? "", 0)}</div>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-fog">
                          <span className="truncate">
                            on {fmtMoney(r.collateral_amount, m?.collateral_symbol ?? "", 2)} · up to {fmtBps(r.max_apr_bps)} · {fmtTerm(r.term_seconds)}
                          </span>
                        </div>
                      </div>
                      <div className="hidden shrink-0 sm:block">
                        <Address address={r.borrower_address} size={20} className="[&>span:last-child]:text-[12px] [&>span:last-child]:text-fog" />
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1 text-[11.5px] font-semibold text-amber-deep" title="Launch window">
                        <Clock className="size-3" aria-hidden="true" />
                        {fmtCountdown(r.fill_deadline)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {DOORS.map((d) => {
            const Icon = d.icon;
            return (
              <Link key={d.href} href={d.href} className="card card-hover group flex flex-col p-6">
                <span className="flex items-center justify-between">
                  <span className="icon-tile">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-haze text-tide transition-all group-hover:bg-lagoon group-hover:text-white">
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </span>
                <span className="mt-6 text-[12px] font-semibold text-lagoon-deep">{d.eyebrow}</span>
                <span className="mt-1 block font-display text-[21px] leading-tight text-navy">{d.title}</span>
                <span className="mt-2 block text-[13.5px] leading-relaxed text-tide">{d.body}</span>
              </Link>
            );
          })}
        </div>
      </Console>
    </>
  );
}
