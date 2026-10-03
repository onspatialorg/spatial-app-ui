"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/platform/PlatformProviders";
import { useAsync, useMarketData } from "@/components/platform/usePlatformData";
import { Address, Badge, Console, Drawer, EmptyState, Meter, Notice, Panel, PanelHeader, ConsoleHeader, Select, Skeleton, StatPill, Table, Td, Th } from "@/components/platform/ui";
import { TokenAvatar } from "@/components/TokenAvatar";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { getLoanEvents, getLoans, getSlicesForLoans } from "@/lib/platform/queries";
import { healthFactor, loanDebt, num } from "@/lib/platform/math";
import { fmtBps, fmtCompact, fmtDate, fmtHf, fmtMoney, fmtTerm, shortAddress, statusTone } from "@/lib/platform/format";
import type { Loan, Slice } from "@/lib/platform/types";
import { cn } from "@/lib/utils";

export default function ExplorerPage() {
  const { db } = useSession();
  const market = useMarketData();
  const loans = useAsync(async () => {
    const all = await getLoans(db, 300);
    const slices = await getSlicesForLoans(db, all.map((l) => l.id));
    return { all, slices };
  }, [db]);
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Loan | null>(null);

  const rows = useMemo(
    () => (loans.data?.all ?? []).filter((l) => status === "all" || l.status === status),
    [loans.data, status]
  );

  const cfg = market.data?.config;
  const settlementAsset = cfg?.chain.settlement_asset || market.data?.markets[0]?.loan_symbol || "";
  const concentration = useMemo(() => {
    if (!loans.data || !market.data) return [];
    const byMarket: Record<string, number> = {};
    for (const l of loans.data.all) if (["active", "refinancing", "liquidating"].includes(l.status)) byMarket[l.market_id] = (byMarket[l.market_id] ?? 0) + num(l.principal);
    return Object.entries(byMarket)
      .map(([id, v]) => ({ market: market.marketById[id], outstanding: v }))
      .filter((x) => x.market)
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [loans.data, market.data, market.marketById]);

  return (
    <>
      <ConsoleHeader
        eyebrow="Explorer"
        title="The whole loan book, open to anyone."
        description="Each loan, the syndicate behind it, its Flight log, and every parameter it runs under. Nothing on this page needs a sign-in."
        stats={[
          { label: "Total originated", value: market.data ? fmtCompact(market.data.stats?.total_originated, settlementAsset) : "…", hint: market.data ? `${market.data.stats?.total_loans ?? 0} loans` : undefined },
          { label: "Outstanding", value: market.data ? fmtCompact(market.data.stats?.outstanding_principal, settlementAsset) : "…", hint: market.data ? `${market.data.stats?.active_loans ?? 0} active` : undefined, accent: "lagoon" },
          { label: "Participants", value: market.data ? `${market.data.stats?.unique_lenders ?? 0} / ${market.data.stats?.unique_borrowers ?? 0}` : "…", hint: "lenders / borrowers" },
          { label: "Bad debt", value: market.data ? fmtMoney(0, settlementAsset, 0) : "…", hint: market.data ? `${market.data.stats?.liquidations ?? 0} liquidations` : undefined, accent: "leaf" },
        ]}
      />
      <Console className="space-y-6">
        {market.error && <Notice tone="error">{market.error}</Notice>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
          <Panel>
            <PanelHeader
              eyebrow="Loan registry"
              title="Every loan on record"
              description="Choose a loan to open its syndicate and Flight log."
              action={
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-44" aria-label="Filter by status">
                  <option value="all">Every status</option>
                  {["active", "refinancing", "liquidating", "repaid", "settled", "defaulted"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              }
            />
            {loans.loading && !loans.data ? (
              <Skeleton rows={6} />
            ) : rows.length === 0 ? (
              <EmptyState title="Nothing on record yet" body="A loan is listed the moment its borrow request settles on-chain. Change the status filter if you expected to see one." />
            ) : (
              <Table minWidth={900}>
                <thead>
                  <tr>
                    <Th>Collateral</Th>
                    <Th>Borrower</Th>
                    <Th>Principal</Th>
                    <Th>APR</Th>
                    <Th>Health</Th>
                    <Th>Lenders</Th>
                    <Th>Matures</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => {
                    const m = market.marketById[l.market_id];
                    const slices = loans.data!.slices.filter((s) => s.loan_id === l.id);
                    const price = num(market.data?.prices[l.market_id]?.price);
                    const session = market.data?.prices[l.market_id]?.session ?? "regular";
                    const debt = cfg ? loanDebt(l, slices, cfg) : { total: 0 };
                    const hf = m && cfg ? healthFactor(num(l.collateral_amount), price, debt.total, m, session) : Infinity;
                    const isSelected = selected?.id === l.id;
                    const live = l.status === "active";
                    return (
                      <tr
                        key={l.id}
                        onClick={() => setSelected(l)}
                        className={cn("group cursor-pointer transition-colors", isSelected && "bg-lagoon-soft")}
                        aria-selected={isSelected}
                      >
                        <Td>
                          <span className="flex items-center gap-3">
                            {m && <TokenAvatar symbol={m.collateral_symbol} size={32} />}
                            <span className="readout whitespace-nowrap text-[13.5px] font-semibold text-navy">{fmtMoney(l.collateral_amount, m?.collateral_symbol ?? "", 2)}</span>
                          </span>
                        </Td>
                        <Td>
                          <Address address={l.borrower_address} />
                        </Td>
                        <Td className="readout whitespace-nowrap text-[14px] font-semibold text-navy">{fmtMoney(l.principal, m?.loan_symbol ?? "", 0)}</Td>
                        <Td>
                          <span className="readout rounded-full bg-lagoon-soft px-2.5 py-1 text-[12px] font-semibold text-lagoon-deep">{fmtBps(l.blended_apr_bps)}</span>
                        </Td>
                        <Td>
                          {live ? (
                            <span className={cn("readout rounded-full px-2.5 py-1 text-[12px] font-semibold", hf < 1 ? "bg-rose-soft text-rose-deep" : hf < (cfg?.loan.warningHf || 1.1) ? "bg-amber-soft text-amber-deep" : "bg-leaf-soft text-leaf-deep")}>
                              {fmtHf(hf)}
                            </span>
                          ) : (
                            <span className="text-fog">n/a</span>
                          )}
                        </Td>
                        <Td className="readout">{slices.length}</Td>
                        <Td className="readout whitespace-nowrap text-[12.5px]">{fmtDate(l.maturity)}</Td>
                        <Td>
                          <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                        </Td>
                        <Td className="pr-0 text-right">
                          <ChevronRight className="inline size-4 text-pale transition-colors group-hover:text-lagoon" aria-hidden="true" />
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Panel>

          <div className="space-y-6">
            <Panel>
              <PanelHeader eyebrow="Risk" title="Concentration by token" description="Outstanding principal per collateral token, measured against its exposure cap." />
              {concentration.length === 0 ? (
                <p className="text-[13.5px] text-tide">Nothing is outstanding at the moment.</p>
              ) : (
                <ul className="space-y-4">
                  {concentration.map(({ market: m, outstanding }) => {
                    const cap = num(m.exposure_cap);
                    const pct = cap > 0 ? Math.min(100, (outstanding / cap) * 100) : 0;
                    return (
                      <li key={m.id} className="flex items-center gap-3">
                        <TokenAvatar symbol={m.collateral_symbol} size={34} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3 text-[13px]">
                            <span className="font-semibold text-navy">{m.collateral_symbol}</span>
                            <span className="readout text-[12px] text-tide">
                              {fmtCompact(outstanding, m.loan_symbol)} <span className="text-fog">of {fmtCompact(cap)}</span>
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <Meter value={pct} tone={pct > 80 ? "amber" : "lagoon"} />
                            <span className="readout w-9 shrink-0 text-right text-[11.5px] font-semibold text-tide">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel>
              <PanelHeader eyebrow="Protocol" title="Parameters in force" description="The settings every loan on this page is bound by." />
              {!cfg ? (
                <Skeleton rows={5} />
              ) : (
                <dl className="divide-y divide-line-soft text-[13px]">
                  <Param k="Terms" v={cfg.terms.map(fmtTerm).join(", ") || "n/a"} />
                  <Param k="Origination fee" v={fmtBps(cfg.fees.originationBps)} />
                  <Param k="Interest share" v={fmtBps(cfg.fees.interestShareBps, 0)} />
                  <Param k="Rollover fee" v={fmtBps(cfg.fees.refinanceBps)} />
                  <Param k="Minimum interest" v={fmtTerm(cfg.loan.minInterestPeriod)} />
                  <Param k="Grace window" v={`${Math.round(cfg.loan.graceWindow / 3600)} h`} />
                  <Param k="Auction start" v={`oracle +${fmtBps(cfg.auction.startPremiumBps, 0)}`} />
                  <Param k="Auction floor" v={`${fmtBps(cfg.auction.floorBpsRegular, 0)} regular, ${fmtBps(cfg.auction.floorBpsClosed, 0)} closed`} />
                  <Param k="Penalty" v={fmtBps(cfg.auction.penaltyBps, 0)} />
                  <Param k="Rollover cap" v={`+${fmtBps(cfg.refinance.capSpreadBps, 0)} across ${Math.round(cfg.refinance.duration / 3600)} h`} />
                  <Param k="Chain" v={`${cfg.chain.name || "n/a"} (${cfg.chain.id || "?"})`} />
                  <Param k="CreditHub" v={typeof cfg.deployment.CreditHub === "string" ? shortAddress(cfg.deployment.CreditHub) : "not configured"} />
                </dl>
              )}
            </Panel>
          </div>
        </div>

        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `Loan ${selected.id.slice(0, 8)}` : "Loan"}>
          {selected && (
            <LoanDetail loan={selected} market={market} slices={loans.data?.slices.filter((s) => s.loan_id === selected.id) ?? []} />
          )}
        </Drawer>
      </Console>
    </>
  );
}

function Param({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-tide">{k}</dt>
      <dd className="readout min-w-0 break-words text-right font-medium text-navy">{v}</dd>
    </div>
  );
}

const FLAG_LABELS: Array<[number, string]> = [
  [1, "collateral in kind"],
  [2, "no closed-market liquidation"],
  [4, "parks idle capital"],
];

function LoanDetail({ loan, market, slices }: { loan: Loan; market: ReturnType<typeof useMarketData>; slices: Slice[] }) {
  const { db } = useSession();
  const events = useAsync(() => getLoanEvents(db, loan.id), [db, loan.id]);
  const m = market.marketById[loan.market_id];
  const explorer = market.data?.config.chain.explorer ?? null;
  const loanSymbol = m?.loan_symbol ?? "";
  const txLink = (hash: string) => (explorer ? `${explorer.replace(/\/$/, "")}/tx/${hash}` : null);
  const total = slices.reduce((acc, s) => acc + num(s.principal), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3.5">
        {m && <TokenAvatar symbol={m.collateral_symbol} size={48} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="readout font-display text-[26px] leading-tight">{fmtMoney(loan.principal, loanSymbol, 0)}</h2>
            <Badge tone={statusTone(loan.status)}>{loan.status}</Badge>
          </div>
          <p className="mt-1 text-[13.5px] text-tide">
            against {fmtMoney(loan.collateral_amount, m?.collateral_symbol ?? "", 2)}, opened {fmtDate(loan.started_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Blended APR" value={fmtBps(loan.blended_apr_bps)} tone="lagoon" />
        <StatPill label="Term" value={fmtTerm(loan.term_seconds)} />
        <StatPill label="Oracle at origination" value={loan.origination_price ? fmtMoney(loan.origination_price, loanSymbol) : "n/a"} />
        <StatPill label="Falls due" value={fmtDate(loan.maturity)} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Address address={loan.borrower_address} size={26} />
          <span className="rounded-full bg-haze px-2 py-0.5 text-[11.5px] font-medium text-tide">borrower</span>
        </div>
        {loan.tx_hash && (
          <div className="readout mt-2 break-all text-[12px] text-fog">
            {txLink(loan.tx_hash) ? (
              <a href={txLink(loan.tx_hash)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-lagoon-deep hover:underline">
                Origination transaction {shortAddress(loan.tx_hash)}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            ) : (
              <>tx {loan.tx_hash}</>
            )}
          </div>
        )}
      </div>

      <section>
        <h3 className="mb-3 text-[15px] font-semibold">Syndicate · {slices.length} lender{slices.length === 1 ? "" : "s"}</h3>
        {slices.length === 0 ? (
          <p className="text-[13px] text-tide">No slices are attached to this loan.</p>
        ) : (
          <ul className="space-y-2">
            {slices.map((s) => {
              const flags = FLAG_LABELS.filter(([bit]) => s.flags & bit).map(([, label]) => label);
              const share = total > 0 ? (num(s.principal) / total) * 100 : 0;
              return (
                <li key={s.id} className="rounded-2xl border border-line-soft bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Address address={s.lender_address} size={26} />
                    <span className="flex items-center gap-2">
                      <span className="readout text-[13.5px] font-semibold text-navy">{fmtMoney(s.principal, loanSymbol, 0)}</span>
                      <span className="readout rounded-full bg-lagoon-soft px-2 py-0.5 text-[11.5px] font-semibold text-lagoon-deep">{fmtBps(s.apr_bps)}</span>
                    </span>
                  </div>
                  <Meter value={share} className="mt-2.5 h-1.5" />
                  {flags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {flags.map((f) => (
                        <span key={f} className="rounded-full bg-haze px-2 py-0.5 text-[11px] font-medium text-tide">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-[15px] font-semibold">Flight log</h3>
        {events.loading && !events.data ? (
          <Skeleton rows={3} />
        ) : events.data && events.data.length === 0 ? (
          <p className="text-[13px] text-tide">No events have been logged for this loan.</p>
        ) : (
          <ol className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line">
            {(events.data ?? []).map((e, i) => {
              const link = e.tx_hash ? txLink(e.tx_hash) : null;
              return (
                <li key={e.id} className="relative">
                  <span
                    className={cn("absolute -left-6 top-1 size-[15px] rounded-full border-[3px] border-canvas", i === 0 ? "bg-lagoon" : "bg-mint")}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[13.5px] font-semibold capitalize text-navy">{e.type.replace(/_/g, " ")}</span>
                    <span className="readout text-[11.5px] text-fog">{fmtDate(e.created_at)}</span>
                  </div>
                  {Object.keys(e.payload ?? {}).length > 0 && (
                    <dl className="mt-1.5 flex flex-wrap gap-1">
                      {Object.entries(e.payload).map(([k, v]) => (
                        <div key={k} className="readout rounded-lg bg-haze px-2 py-1 text-[11px] text-tide">
                          <dt className="inline text-fog">{k.replace(/_/g, " ")} </dt>
                          <dd className="inline font-medium text-navy">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {e.tx_hash && (
                    <div className="readout mt-1.5 text-[11.5px]">
                      {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lagoon-deep hover:underline">
                          {shortAddress(e.tx_hash)}
                          <ArrowUpRight className="size-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-fog">{shortAddress(e.tx_hash)}</span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
