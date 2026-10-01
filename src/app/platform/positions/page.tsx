"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/platform/PlatformProviders";
import { RequireAuth } from "@/components/platform/PlatformShell";
import { useAsync, useMarketData, useNow } from "@/components/platform/usePlatformData";
import { Badge, Console, Button, EmptyState, Field, Input, LtvGauge, Notice, Panel, PanelHeader, ConsoleHeader, Readout, Skeleton, StatPill, Table, Td, Th } from "@/components/platform/ui";
import { TokenAvatar } from "@/components/TokenAvatar";
import { CalendarClock } from "lucide-react";
import { getMyLoans, getMySlices, getSlicesForLoans, getLoans, recordCollateralAdded, recordRepayment } from "@/lib/platform/queries";
import { healthFactor, loanDebt, num, simpleInterest } from "@/lib/platform/math";
import { fmtBps, fmtCountdown, fmtDate, fmtHf, fmtMoney, fmtTerm, statusTone, friendlyError } from "@/lib/platform/format";
import type { Loan, Slice } from "@/lib/platform/types";
import { cn } from "@/lib/utils";

export default function PositionsPage() {
  return (
    <>
      <ConsoleHeader
        eyebrow="Positions"
        title="Everything you owe and everything you hold."
        description="Debt, interest to date, health factor and time left for each loan in your name and each slice you funded, priced off the newest oracle reading and the parameters currently in force."
      />
      <Console>
        <RequireAuth title="Sign in to open your positions" body="Loans and slices belong to a wallet address. Sign in by email, through a social login or with an EVM wallet of your own, and the ones under your address appear here.">
          <Positions />
        </RequireAuth>
      </Console>
    </>
  );
}

function Positions() {
  const { db, userId } = useSession();
  const market = useMarketData();
  const now = useNow();
  const loans = useAsync(async () => {
    if (!userId) return { asBorrower: [] as Loan[], slices: [] as Slice[], lentLoans: [] as Loan[], lentSlices: [] as Slice[] };
    const [asBorrower, mySlices] = await Promise.all([getMyLoans(db, userId), getMySlices(db, userId)]);
    const borrowerSlices = await getSlicesForLoans(db, asBorrower.map((l) => l.id));
    const lentLoanIds = [...new Set(mySlices.map((s) => s.loan_id))];
    const all = lentLoanIds.length ? await getLoans(db, 500) : [];
    const lentLoans = all.filter((l) => lentLoanIds.includes(l.id));
    const lentSlices = await getSlicesForLoans(db, lentLoanIds);
    return { asBorrower, slices: borrowerSlices, lentLoans, lentSlices, mySlices };
  }, [db, userId]);

  const reload = async () => {
    await loans.reload();
    await market.reload();
  };

  if ((loans.loading && !loans.data) || !market.data) return <Panel><Skeleton rows={6} /></Panel>;
  if (loans.error) return <Notice tone="error">{loans.error}</Notice>;

  const d = loans.data!;
  const warningHf = market.data.config.loan.warningHf || 1.1;
  const cfg = market.data.config;
  const nowDate = new Date(now);
  const asset = cfg.chain.settlement_asset || market.data.markets[0]?.loan_symbol || "";

  // Totals for the summary row, from the same figures the cards and table use
  const liveBorrowed = d.asBorrower.filter((l) => l.status === "active" || l.status === "refinancing");
  const owed = liveBorrowed.reduce((acc, l) => acc + loanDebt(l, d.slices.filter((s) => s.loan_id === l.id), cfg, nowDate).total, 0);
  const pledged = liveBorrowed.reduce((acc, l) => acc + num(l.collateral_amount) * num(market.data!.prices[l.market_id]?.price), 0);
  const mySlices = d.mySlices ?? [];
  const lentOut = mySlices.filter((s) => s.status === "active").reduce((acc, s) => acc + num(s.principal), 0);
  const earned = mySlices.reduce((acc, s) => {
    if (s.status !== "active") return acc + num(s.interest_paid);
    const l = d.lentLoans.find((x) => x.id === s.loan_id);
    const elapsed = l ? Math.max((now - new Date(l.started_at).getTime()) / 1000, cfg.loan.minInterestPeriod) : 0;
    return acc + simpleInterest(num(s.principal), s.apr_bps, elapsed);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Readout label="You owe" value={fmtMoney(owed, asset, 0)} hint={`${liveBorrowed.length} open loan${liveBorrowed.length === 1 ? "" : "s"}`} />
        <Readout label="Collateral pledged" value={fmtMoney(pledged, asset, 0)} hint="at the latest oracle prices" />
        <Readout label="Lent out" value={fmtMoney(lentOut, asset, 0)} hint={`${mySlices.filter((s) => s.status === "active").length} active slices`} accent="lagoon" />
        <Readout label="Interest earned" value={fmtMoney(earned, asset, 2)} hint="accrued and paid, all slices" accent="leaf" />
      </div>

      <Panel>
        <PanelHeader
          eyebrow="Borrowing"
          title="Loans in your name"
          description="Pay back whenever you like; each slice charges a floor of three days of interest. Adding collateral lifts the health factor straight away."
        />
        {d.asBorrower.length === 0 ? (
          <EmptyState title="Nothing borrowed so far" body="Once a borrow request of yours settles on-chain, the resulting loan is listed here with its live figures." />
        ) : (
          <div className="space-y-4">
            {d.asBorrower.map((l) => (
              <BorrowerLoanCard key={l.id} loan={l} slices={d.slices.filter((s) => s.loan_id === l.id)} market={market} onChange={reload} />
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Lending"
          title="Slices in your wallet"
          description="One row for each slice token you hold. The rate on each is the one you offered, and interest builds by the second until the loan closes."
        />
        {mySlices.length === 0 ? (
          <EmptyState title="No slices held yet" body="When a borrower originates against an offer you signed, the fill becomes a slice and a slice token is minted to your address." />
        ) : (
          <Table minWidth={780}>
            <thead>
              <tr>
                <Th>Collateral</Th>
                <Th>Your principal</Th>
                <Th>APR</Th>
                <Th>Interest</Th>
                <Th>Health</Th>
                <Th>Matures</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {mySlices.map((s) => {
                const l = d.lentLoans.find((x) => x.id === s.loan_id);
                const m = l ? market.marketById[l.market_id] : null;
                const price = l ? num(market.data?.prices[l.market_id]?.price) : 0;
                const session = l ? (market.data?.prices[l.market_id]?.session ?? "regular") : "regular";
                const all = d.lentSlices.filter((x) => x.loan_id === s.loan_id);
                const debt = l ? loanDebt(l, all, cfg, nowDate) : { total: 0, principal: 0, interest: 0 };
                const hf = l && m ? healthFactor(num(l.collateral_amount), price, debt.total, m, session) : Infinity;
                const elapsed = l ? Math.max((now - new Date(l.started_at).getTime()) / 1000, cfg.loan.minInterestPeriod) : 0;
                const accrued = simpleInterest(num(s.principal), s.apr_bps, elapsed);
                const live = l?.status === "active";
                return (
                  <tr key={s.id}>
                    <Td>
                      <span className="flex items-center gap-3">
                        {m && <TokenAvatar symbol={m.collateral_symbol} size={32} />}
                        <span className="min-w-0">
                          <span className="readout block text-[13.5px] font-semibold text-navy">{l ? fmtMoney(l.collateral_amount, m?.collateral_symbol ?? "", 2) : "…"}</span>
                          <span className="readout block text-[11.5px] text-fog">loan {s.loan_id.slice(-6)}</span>
                        </span>
                      </span>
                    </Td>
                    <Td className="readout text-[14px] font-semibold text-navy">{fmtMoney(s.principal, m?.loan_symbol ?? "", 0)}</Td>
                    <Td>
                      <span className="readout rounded-full bg-lagoon-soft px-2.5 py-1 text-[12px] font-semibold text-lagoon-deep">{fmtBps(s.apr_bps)}</span>
                    </Td>
                    <Td className="readout text-leaf-deep">{s.status === "active" ? fmtMoney(accrued, m?.loan_symbol ?? "") : fmtMoney(s.interest_paid, m?.loan_symbol ?? "")}</Td>
                    <Td>
                      {live ? (
                        <span className={cn("readout rounded-full px-2.5 py-1 text-[12px] font-semibold", hf < warningHf ? "bg-amber-soft text-amber-deep" : "bg-leaf-soft text-leaf-deep")}>{fmtHf(hf)}</span>
                      ) : (
                        <span className="text-fog">n/a</span>
                      )}
                    </Td>
                    <Td className="readout text-[12.5px]">{l ? fmtCountdown(l.maturity) : "…"}</Td>
                    <Td>
                      <Badge tone={statusTone(l?.status ?? s.status)}>{l?.status ?? s.status}</Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  );
}

function BorrowerLoanCard({
  loan,
  slices,
  market,
  onChange,
}: {
  loan: Loan;
  slices: Slice[];
  market: ReturnType<typeof useMarketData>;
  onChange: () => Promise<void>;
}) {
  const { api } = useSession();
  const m = market.marketById[loan.market_id];
  const price = num(market.data?.prices[loan.market_id]?.price);
  const session = market.data?.prices[loan.market_id]?.session ?? "regular";
  const config = market.data!.config;
  const debt = useMemo(() => loanDebt(loan, slices, config), [loan, slices, config]);
  const hf = m ? healthFactor(num(loan.collateral_amount), price, debt.total, m, session) : Infinity;
  const warn = hf < (config.loan.warningHf || 1.1);
  const [repayAmount, setRepayAmount] = useState("");
  const [topUp, setTopUp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setRepayAmount("");
      setTopUp("");
      await onChange();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const active = loan.status === "active";
  const loanSymbol = m?.loan_symbol ?? "";
  const collateralSymbol = m?.collateral_symbol ?? "";
  const countdown = fmtCountdown(loan.maturity);

  const value = num(loan.collateral_amount) * price;
  const ltvNow = value > 0 ? (debt.total / value) * 10_000 : NaN;

  return (
    <article className={cn("rounded-[22px] border p-4 md:p-5", active ? "border-line bg-white" : "border-line-soft bg-canvas/60")}>
      <div className="flex items-start gap-3.5">
        <TokenAvatar symbol={collateralSymbol || "?"} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="readout text-[18px] font-semibold leading-snug text-navy">
              {fmtMoney(loan.principal, loanSymbol, 0)}
              <span className="ml-2 font-sans text-[13px] font-normal text-fog">against {fmtMoney(loan.collateral_amount, collateralSymbol, 2)}</span>
            </h3>
            <Badge tone={statusTone(loan.status)}>{loan.status}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
            <span className="readout rounded-full bg-lagoon-soft px-2.5 py-1 font-semibold text-lagoon-deep">{fmtBps(loan.blended_apr_bps)} blended</span>
            <span className="rounded-full bg-haze px-2.5 py-1 font-medium text-tide">{fmtTerm(loan.term_seconds)}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-haze px-2.5 py-1 font-medium text-tide">
              <CalendarClock className="size-3" aria-hidden="true" />
              {active ? `due ${fmtDate(loan.maturity)} (${countdown === "expired" ? "past due" : `${countdown} left`})` : `matured ${fmtDate(loan.maturity)}`}
            </span>
            {loan.tx_hash && (
              <span className="readout rounded-full bg-haze px-2.5 py-1 text-fog" title={loan.tx_hash}>
                tx {loan.tx_hash.slice(0, 10)}…
              </span>
            )}
          </div>
        </div>
      </div>

      {active && m && <LtvGauge ltvBps={ltvNow} maxBps={m.max_ltv_bps} liqBps={m.liq_ltv_bps} className="mt-5" />}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Mini label="Debt" value={fmtMoney(debt.total, loanSymbol)} />
        <Mini label="Interest so far" value={fmtMoney(debt.interest, loanSymbol)} />
        <Mini label="Health factor" value={active ? fmtHf(hf) : "n/a"} tone={active ? (warn ? "warn" : "good") : undefined} />
        <Mini label="Lenders" value={String(slices.length)} />
      </div>

      {warn && active && (
        <div className="mt-4">
          <Notice tone="warn">
            Your health factor sits under the warning line. Add collateral or pay part of the debt down before it touches 1.00, and remember the closed-market haircut applies while the exchange is shut, so look at that figure ahead of the weekend.
          </Notice>
        </div>
      )}

      {active && (
        <div className="mt-4 grid gap-4 rounded-[18px] bg-haze p-4 sm:grid-cols-2">
          <Field label="Repay" hint="Any amount, at any moment. Clearing the full debt closes the loan and releases the collateral.">
            <div className="flex gap-2">
              <Input inputMode="decimal" placeholder="0.00" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} aria-label="Repayment amount" suffix={loanSymbol} />
              <Button variant="ghost" className="btn-sm shrink-0 bg-white" disabled={busy} onClick={() => setRepayAmount(debt.total.toFixed(2))}>
                Max
              </Button>
              <Button className="btn-sm shrink-0" disabled={busy || num(repayAmount) <= 0} onClick={() => void act(() => recordRepayment(api, loan.id, num(repayAmount), null))}>
                Repay
              </Button>
            </div>
          </Field>
          <Field label="Add collateral" hint="More collateral behind the same debt means a higher health factor.">
            <div className="flex gap-2">
              <Input inputMode="decimal" placeholder="0.00" value={topUp} onChange={(e) => setTopUp(e.target.value)} aria-label="Collateral to add" suffix={collateralSymbol} />
              <Button variant="secondary" className="btn-sm shrink-0" disabled={busy || num(topUp) <= 0} onClick={() => void act(() => recordCollateralAdded(api, loan.id, num(topUp), null))}>
                Top up
              </Button>
            </div>
          </Field>
        </div>
      )}

      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </article>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "warn" | "good" }) {
  return <StatPill label={label} value={value} tone={tone === "warn" ? "amber" : tone === "good" ? "leaf" : undefined} />;
}
