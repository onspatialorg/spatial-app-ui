"use client";

import { useEffect, useMemo, useState } from "react";
import { useSignTypedData, useWallets } from "@privy-io/react-auth";
import type { Address, EIP1193Provider } from "viem";
import { useSession } from "@/components/platform/PlatformProviders";
import { RequireAuth } from "@/components/platform/PlatformShell";
import { useAsync, useMarketData } from "@/components/platform/usePlatformData";
import { Address as AddressChip, Badge, Console, Button, EmptyState, Field, Input, LtvGauge, Meter, Notice, Panel, PanelHeader, ConsoleHeader, Segmented, Skeleton, StatPill } from "@/components/platform/ui";
import { TokenAvatar } from "@/components/TokenAvatar";
import { Clock, PenLine, Sparkles } from "lucide-react";
import { cancelRequest, getMyRequests, insertRequest, settleRequest } from "@/lib/platform/queries";
import { buildRequestMessage, hashRequest, randomBytes32, requestTypedData, toPrivyTypedData } from "@/lib/platform/eip712";
import { deskAddress, submitSettleOnChain } from "@/lib/platform/contracts";
import { healthFactor, indicativeRate, ltvBps, matchOffers, maxBorrowable, num } from "@/lib/platform/math";
import { fmtBps, fmtCountdown, fmtHf, fmtMoney, fmtTerm, statusTone, friendlyError } from "@/lib/platform/format";
import { cn } from "@/lib/utils";
import { platformEnv } from "@/lib/platform/env";

export default function BorrowPage() {
  return (
    <>
      <ConsoleHeader
        eyebrow="Borrow"
        title="Borrow against what you hold."
        description="Pick a Stock Token, name the principal, cap the rate and fix the term. Lenders fund slices from the book, and a single transaction settles every slice at once. Repay whenever you like."
      />
      <Console>
        <RequireAuth title="Sign in before you post a request">
          <BorrowWorkspace />
        </RequireAuth>
      </Console>
    </>
  );
}

function BorrowWorkspace() {
  const { db, userId, walletAddress } = useSession();
  const market = useMarketData();
  const mine = useAsync(() => (userId ? getMyRequests(db, userId) : Promise.resolve([])), [db, userId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <RequestForm
        marketData={market}
        onCreated={async () => {
          await mine.reload();
          await market.reload();
        }}
      />
      <MyRequests marketData={market} mine={mine} walletAddress={walletAddress} />
    </div>
  );
}

function RequestForm({
  marketData,
  onCreated,
}: {
  marketData: ReturnType<typeof useMarketData>;
  onCreated: () => Promise<void>;
}) {
  const { api, userId, walletAddress } = useSession();
  const { signTypedData } = useSignTypedData();
  const { data } = marketData;

  const [marketId, setMarketId] = useState("");
  const [collateral, setCollateral] = useState("");
  const [principal, setPrincipal] = useState("");
  const [maxApr, setMaxApr] = useState("");
  const [term, setTerm] = useState<number>(0);
  const [deadlineHours, setDeadlineHours] = useState("24");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (data && !marketId && data.markets[0]) setMarketId(data.markets[0].id);
    if (data && !term && data.config.terms[0]) setTerm(data.config.terms.includes(2_592_000) ? 2_592_000 : data.config.terms[0]);
  }, [data, marketId, term]);

  const m = data?.markets.find((x) => x.id === marketId) ?? null;
  const price = m ? num(data?.prices[m.id]?.price) : 0;
  const session = m ? (data?.prices[m.id]?.session ?? "regular") : "regular";
  const collateralNum = num(collateral);
  const principalNum = num(principal);
  const maxBorrow = m && price ? maxBorrowable(collateralNum, price, m, session) : 0;
  const ltv = m && price && collateralNum > 0 ? ltvBps(principalNum, collateralNum * price) : 0;
  const hf = m && price && principalNum > 0 ? healthFactor(collateralNum, price, principalNum, m, session) : Infinity;
  const rate = m && data && term ? indicativeRate(data.offers, m.id, m.tier, term) : null;
  const originationFee = data ? (principalNum * data.config.fees.originationBps) / 10_000 : 0;
  const minInterestDays = data ? Math.max(1, Math.round((data.config.loan.minInterestPeriod || 259_200) / 86_400)) : 3;

  useEffect(() => {
    if (rate !== null && !maxApr) setMaxApr((rate / 100).toFixed(2));
  }, [rate, maxApr]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m || !data || !userId || !walletAddress) return;
    setError(null);
    setDone(null);
    if (collateralNum <= 0 || principalNum <= 0) return setError("Fill in both the collateral amount and the principal.");
    const tierCeiling = fmtBps(m.max_ltv_bps, 0);
    if (principalNum > maxBorrow) return setError(`That principal is above this tier's ceiling of ${tierCeiling}.`);
    if (!price) return setError("This market has no oracle price yet, so the request cannot be sized.");
    setBusy(true);
    try {
      const fillDeadline = new Date(Date.now() + Math.max(1, num(deadlineHours)) * 3_600_000);
      const salt = randomBytes32();
      const maxAprBps = Math.round(num(maxApr) * 100);
      const message = buildRequestMessage({
        borrower: walletAddress as Address,
        market: m,
        collateralAmount: collateral,
        principal,
        maxAprBps,
        termSeconds: term,
        fillDeadline,
        salt,
      });
      const verifying = deskAddress(data.config);
      const requestHash = hashRequest(platformEnv.chainId, verifying, message);
      const { signature } = await signTypedData(toPrivyTypedData(requestTypedData(platformEnv.chainId, verifying, message)), {
        address: walletAddress,
      });
      await insertRequest(api, {
        borrower_address: walletAddress,
        market_id: m.id,
        collateral_amount: collateral,
        principal,
        max_apr_bps: maxAprBps,
        term_seconds: term,
        fill_deadline: fillDeadline.toISOString(),
        salt,
        request_hash: requestHash,
        signature,
      });
      setDone("Signed and on the book. Fills can start arriving now.");
      setCollateral("");
      setPrincipal("");
      await onCreated();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Panel><Skeleton rows={8} /></Panel>;

  const ceilingBps = m ? m.max_ltv_bps - (session === "closed" ? m.closed_haircut_bps : 0) : 0;
  const warnHf = data.config.loan.warningHf || 1.1;

  return (
    <Panel className="card-accent">
      <PanelHeader eyebrow="New request" title="Post a borrow request" description="Three choices: what you pledge, how much you need, and the terms you will accept." />
      <form onSubmit={submit} className="space-y-6">
        <div>
          <p className="mb-2.5 text-[13px] font-medium text-navy">Collateral</p>
          <div role="radiogroup" aria-label="Collateral market" className="grid grid-cols-2 gap-2">
            {data.markets.map((x) => {
              const active = x.id === marketId;
              const px = num(data.prices[x.id]?.price);
              return (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMarketId(x.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                    active ? "border-lagoon bg-lagoon-faint shadow-[0_0_0_3px_var(--color-lagoon-soft)]" : "border-line bg-white hover:border-lagoon-muted"
                  )}
                >
                  <TokenAvatar symbol={x.collateral_symbol} size={34} />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-navy">{x.collateral_symbol}</span>
                    <span className="readout block truncate text-[11.5px] text-fog">
                      {px ? fmtMoney(px, x.loan_symbol) : "no price"} · tier {x.tier_label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="You pledge" hint={m && price ? `${fmtMoney(price, m.loan_symbol)} each, ${session} session` : "Waiting on a price"}>
            <Input inputMode="decimal" placeholder="250" value={collateral} onChange={(e) => setCollateral(e.target.value)} suffix={m?.collateral_symbol} />
          </Field>
          <Field label="You borrow" hint={m ? `Up to ${fmtMoney(maxBorrow, m.loan_symbol, 0)} at the ${fmtBps(ceilingBps, 0)} ceiling` : undefined}>
            <Input inputMode="decimal" placeholder="20000" value={principal} onChange={(e) => setPrincipal(e.target.value)} suffix={m?.loan_symbol} />
          </Field>
        </div>

        <div>
          <p className="mb-2.5 text-[13px] font-medium text-navy">Term</p>
          <Segmented label="Term" value={term} onChange={setTerm} options={data.config.terms.map((t) => ({ value: t, label: fmtTerm(t) }))} />
          <p className="mt-1.5 text-[12px] text-fog">Interest is owed for at least {minInterestDays} days.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Highest APR you accept"
            hint={
              rate !== null ? (
                <button type="button" onClick={() => setMaxApr((rate / 100).toFixed(2))} className="inline-flex items-center gap-1 font-semibold text-lagoon-deep hover:underline">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Use the book&apos;s best, {fmtBps(rate)}
                </button>
              ) : (
                "Nothing on the book at this term yet"
              )
            }
          >
            <Input inputMode="decimal" placeholder="9.00" value={maxApr} onChange={(e) => setMaxApr(e.target.value)} suffix="%" />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-medium text-navy">Launch window</p>
            <Segmented
              label="Launch window"
              value={deadlineHours}
              onChange={setDeadlineHours}
              options={["6", "24", "72"].map((h) => ({ value: h, label: `${h} h` }))}
            />
            <p className="mt-1.5 text-[12px] text-fog">How long the book may fill it.</p>
          </div>
        </div>

        <div className="rounded-[20px] bg-[linear-gradient(150deg,#e9f8f7_0%,#eef6fb_100%)] p-4">
          <p className="mb-3 text-[12.5px] font-semibold text-tide">Preview</p>
          {m ? (
            <LtvGauge ltvBps={principalNum > 0 && collateralNum > 0 ? ltv : NaN} maxBps={ceilingBps} liqBps={m.liq_ltv_bps} />
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Health factor" value={principalNum > 0 ? fmtHf(hf) : "n/a"} warn={hf < warnHf} />
            <Metric label="Origination fee" value={m ? fmtMoney(originationFee, m.loan_symbol) : "n/a"} sub={`${fmtBps(data.config.fees.originationBps)} of principal`} />
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        {done && <Notice tone="success">{done}</Notice>}
        <Button type="submit" disabled={busy || !walletAddress} className="btn-lg w-full">
          <PenLine className="size-4" aria-hidden="true" />
          {busy ? "Signing…" : "Sign the request"}
        </Button>
        <p className="text-center text-[12px] leading-relaxed text-fog">
          No gas is spent here. You sign an EIP-712 message, and CreditHub checks those same fields when the loan settles.
        </p>
      </form>
    </Panel>
  );
}

function Metric({ label, value, warn, sub }: { label: string; value: string; warn?: boolean; sub?: string }) {
  return <StatPill label={label} value={value} tone={warn ? "amber" : undefined} sub={sub} onTint />;
}

function MyRequests({
  marketData,
  mine,
  walletAddress,
}: {
  marketData: ReturnType<typeof useMarketData>;
  mine: ReturnType<typeof useAsync<Awaited<ReturnType<typeof getMyRequests>>>>;
  walletAddress: string | null;
}) {
  const { api, userId } = useSession();
  const { wallets } = useWallets();
  const { data, marketById } = marketData;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    if (!data || !mine.data) return {};
    const out: Record<string, ReturnType<typeof matchOffers>> = {};
    for (const r of mine.data) {
      if (r.status !== "open") continue;
      const m = marketById[r.market_id];
      const price = num(data.prices[r.market_id]?.price);
      if (!m || !price) continue;
      out[r.id] = matchOffers(data.offers, num(r.principal), {
        maxAprBps: r.max_apr_bps,
        termSeconds: r.term_seconds,
        ltv: ltvBps(num(r.principal), num(r.collateral_amount) * price),
        marketId: r.market_id,
        tier: m.tier,
        requestId: r.id,
        borrowerId: r.borrower_id,
      });
    }
    return out;
  }, [data, mine.data, marketById]);

  const settle = async (requestId: string) => {
    const r = mine.data?.find((x) => x.id === requestId);
    const match = matches[requestId];
    const m = r ? marketById[r.market_id] : null;
    if (!r || !match || !m || !data || !userId) return;
    setBusyId(requestId);
    setError(null);
    try {
      let txHash: string | null = null;
      const settlementAddr = deskAddress(data.config);
      if (settlementAddr && walletAddress) {
        const w = wallets.find((x) => x.address.toLowerCase() === walletAddress.toLowerCase()) ?? wallets[0];
        if (!w) throw new Error("Your session has no wallet that can send the settle transaction.");
        await w.switchChain(platformEnv.chainId);
        const provider = (await w.getEthereumProvider()) as unknown as EIP1193Provider;
        txHash = await submitSettleOnChain(provider, walletAddress as Address, settlementAddr, r, m, match.picks);
      }
      await settleRequest(api, r.id, match.picks.map((p) => p.offer.id), txHash, null);
      await mine.reload();
      await marketData.reload();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await cancelRequest(api, id);
      await mine.reload();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const onchain = !!deskAddress(data?.config ?? null);

  return (
    <Panel>
      <PanelHeader
        eyebrow="Your requests"
        title="Coverage and settlement"
        description={
          onchain
            ? "Once the book covers the full principal, Settle passes the matched set to CreditHub on Robinhood Chain, which escrows your collateral, pays out the principal and mints one slice token per lender."
            : "No hub address is configured here, so Settle writes the loan into the book without sending a transaction."
        }
      />
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      {mine.loading && !mine.data ? (
        <Skeleton />
      ) : !mine.data || mine.data.length === 0 ? (
        <EmptyState title="Nothing posted yet" body="Post a request and watch its coverage build here as lenders fill it." />
      ) : (
        <ul className="space-y-3">
          {mine.data.map((r) => {
            const m = marketById[r.market_id];
            const match = matches[r.id];
            const coverage = match ? (match.covered / num(r.principal)) * 100 : 0;
            const open = r.status === "open";
            return (
              <li key={r.id} className={cn("rounded-[20px] border p-4 md:p-5", open ? "border-line bg-white" : "border-line-soft bg-canvas/60")}>
                <div className="flex items-start gap-3">
                  {m && <TokenAvatar symbol={m.collateral_symbol} size={40} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="readout text-[16px] font-semibold text-navy">
                        {fmtMoney(r.principal, m?.loan_symbol ?? "", 0)}
                        <span className="ml-1.5 font-sans text-[13px] font-normal text-fog">on {fmtMoney(r.collateral_amount, m?.collateral_symbol ?? "", 2)}</span>
                      </div>
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
                      <span className="rounded-full bg-haze px-2.5 py-1 font-medium text-tide">Up to {fmtBps(r.max_apr_bps)}</span>
                      <span className="rounded-full bg-haze px-2.5 py-1 font-medium text-tide">{fmtTerm(r.term_seconds)}</span>
                      {open && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1 font-semibold text-amber-deep">
                          <Clock className="size-3" aria-hidden="true" />
                          {fmtCountdown(r.fill_deadline)} left
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {open && (
                  <>
                    <div className="mt-4 flex items-baseline justify-between text-[12.5px]">
                      <span className="font-semibold text-navy">{match ? `${coverage.toFixed(0)}% covered` : "Waiting on a price"}</span>
                      {match && match.picks.length > 0 && (
                        <span className="text-tide">
                          {match.picks.length} offer{match.picks.length === 1 ? "" : "s"} · <span className="font-semibold text-lagoon-deep">{fmtBps(match.blendedAprBps)}</span> blended
                        </span>
                      )}
                    </div>
                    <Meter value={coverage} className="mt-2" />

                    {match && match.picks.length > 0 && (
                      <ul className="mt-4 space-y-1">
                        {match.picks.map((p) => (
                          <li key={p.offer.id} className="flex items-center justify-between gap-3 rounded-xl px-1 py-1.5">
                            <AddressChip address={p.offer.maker_address} size={24} />
                            <span className="flex items-center gap-2">
                              <span className="readout text-[13.5px] font-semibold text-navy">{fmtMoney(p.fill, m?.loan_symbol ?? "", 0)}</span>
                              <span className="readout rounded-full bg-lagoon-soft px-2 py-0.5 text-[11.5px] font-semibold text-lagoon-deep">{fmtBps(p.offer.apr_bps)}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 flex gap-2 border-t border-line-soft pt-4">
                      <Button variant="ghost" className="btn-sm" disabled={busyId === r.id} onClick={() => void cancel(r.id)}>
                        Cancel
                      </Button>
                      <Button className="btn-sm ml-auto" disabled={busyId === r.id || !match || coverage < 100} onClick={() => void settle(r.id)}>
                        {busyId === r.id ? "Settling…" : coverage >= 100 ? "Settle the loan" : "Settle when covered"}
                      </Button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
