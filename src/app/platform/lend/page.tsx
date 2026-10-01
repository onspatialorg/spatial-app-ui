"use client";

import { useEffect, useMemo, useState } from "react";
import { useSignTypedData } from "@privy-io/react-auth";
import type { Address, Hex } from "viem";
import { useSession } from "@/components/platform/PlatformProviders";
import { RequireAuth } from "@/components/platform/PlatformShell";
import { useAsync, useMarketData } from "@/components/platform/usePlatformData";
import { Address as AddressChip, Badge, Console, Button, EmptyState, Field, Input, Meter, Notice, Panel, PanelHeader, ConsoleHeader, Segmented, Select, Skeleton, Switch, Table, Td, Th } from "@/components/platform/ui";
import { TokenAvatar } from "@/components/TokenAvatar";
import { Clock, PenLine, Target } from "lucide-react";
import { cancelOffer, getMyOffers, insertOffer } from "@/lib/platform/queries";
import { buildOfferMessage, hashOffer, offerTypedData, randomBytes32, randomNonce, toPrivyTypedData, ZERO_BYTES32 } from "@/lib/platform/eip712";
import { deskAddress } from "@/lib/platform/contracts";
import { ltvBps, num } from "@/lib/platform/math";
import { fmtBps, fmtCompact, fmtCountdown, fmtMoney, fmtTerm, shortAddress, statusTone, friendlyError } from "@/lib/platform/format";
import { OFFER_FLAGS, type BorrowRequest } from "@/lib/platform/types";
import { cn } from "@/lib/utils";
import { platformEnv } from "@/lib/platform/env";

export default function LendPage() {
  const market = useMarketData();
  const [target, setTarget] = useState<BorrowRequest | null>(null);
  const settlementAsset = market.data?.config.chain.settlement_asset || market.data?.markets[0]?.loan_symbol || "";

  return (
    <>
      <ConsoleHeader
        eyebrow="Lend"
        title="Name your rate, fund a slice."
        description="Every open request sits on a public book. Answer one directly, or leave a standing offer on one token or across a whole tier and let matching do the work. Offers are gasless signatures, withdrawable whenever you like and filled only up to the cap you set."
        stats={[
          { label: "Open requests", value: market.data ? String(market.data.stats?.open_requests ?? market.data.requests.length) : "…", hint: "still looking for fills" },
          { label: "Demand on the book", value: market.data ? fmtCompact(market.data.stats?.open_demand, settlementAsset) : "…", hint: "principal borrowers are asking for" },
          { label: "Lend capacity", value: market.data ? fmtCompact(market.data.stats?.open_lend_capacity, settlementAsset) : "…", hint: `${market.data?.stats?.open_offers ?? 0} offers standing`, accent: "lagoon" },
        ]}
      />
      <Console className="space-y-8">
        <OrderBook market={market} onTarget={setTarget} />

        <RequireAuth title="Sign in to place an offer">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <OfferForm market={market} target={target} clearTarget={() => setTarget(null)} />
            <MyOffers market={market} />
          </div>
        </RequireAuth>
      </Console>
    </>
  );
}

function OrderBook({ market, onTarget }: { market: ReturnType<typeof useMarketData>; onTarget: (r: BorrowRequest) => void }) {
  const { data, loading, marketById } = market;
  const { authenticated, userId } = useSession();
  const [filterMarket, setFilterMarket] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");

  const rows = useMemo(() => {
    if (!data) return [];
    return data.requests.filter(
      (r) => (filterMarket === "all" || r.market_id === filterMarket) && (filterTerm === "all" || r.term_seconds === Number(filterTerm))
    );
  }, [data, filterMarket, filterTerm]);

  return (
    <Panel>
      <PanelHeader
        eyebrow="Order book"
        title="Requests waiting for lenders"
        description="Anyone can read this list. Pick a request and price it yourself, or leave a standing offer that matching fills for you."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} className="sm:w-44" aria-label="Filter by collateral">
              <option value="all">Every collateral</option>
              {data?.markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.collateral_symbol}
                </option>
              ))}
            </Select>
            <Select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="sm:w-36" aria-label="Filter by term">
              <option value="all">Every term</option>
              {data?.config.terms.map((t) => (
                <option key={t} value={t}>
                  {fmtTerm(t)}
                </option>
              ))}
            </Select>
          </div>
        }
      />
      {loading && !data ? (
        <Skeleton rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState title="The book is empty" body="New borrow requests land here the moment a borrower signs one." />
      ) : (
        <Table minWidth={820}>
          <thead>
            <tr>
              <Th>Collateral</Th>
              <Th>Borrower</Th>
              <Th>Principal</Th>
              <Th>LTV</Th>
              <Th>Up to</Th>
              <Th>Term</Th>
              <Th>Launch window</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const m = marketById[r.market_id];
              const price = num(data?.prices[r.market_id]?.price);
              const ltv = m && price ? ltvBps(num(r.principal), num(r.collateral_amount) * price) : NaN;
              return (
                <tr key={r.id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      {m && <TokenAvatar symbol={m.collateral_symbol} size={34} />}
                      <span className="min-w-0">
                        <span className="readout block text-[13.5px] font-semibold text-navy">{fmtMoney(r.collateral_amount, m?.collateral_symbol ?? "", 2)}</span>
                        {m && <span className="block text-[11.5px] text-fog">Tier {m.tier_label}</span>}
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <AddressChip address={r.borrower_address} />
                  </Td>
                  <Td className="readout text-[14px] font-semibold text-navy">{fmtMoney(r.principal, m?.loan_symbol ?? "", 0)}</Td>
                  <Td className="readout">{Number.isFinite(ltv) ? fmtBps(ltv, 1) : "n/a"}</Td>
                  <Td>
                    <span className="readout rounded-full bg-lagoon-soft px-2.5 py-1 text-[12px] font-semibold text-lagoon-deep">{fmtBps(r.max_apr_bps)}</span>
                  </Td>
                  <Td>{fmtTerm(r.term_seconds)}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-amber-deep">
                      <Clock className="size-3" aria-hidden="true" />
                      {fmtCountdown(r.fill_deadline)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="secondary"
                      className="btn-sm"
                      disabled={!authenticated || r.borrower_id === userId}
                      onClick={() => onTarget(r)}
                    >
                      <Target className="size-3.5" aria-hidden="true" />
                      Fund this
                    </Button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Panel>
  );
}

function OfferForm({
  market,
  target,
  clearTarget,
}: {
  market: ReturnType<typeof useMarketData>;
  target: BorrowRequest | null;
  clearTarget: () => void;
}) {
  const { api, userId, walletAddress } = useSession();
  const { signTypedData } = useSignTypedData();
  const { data, marketById } = market;

  const [marketId, setMarketId] = useState("");
  const [scope, setScope] = useState<"token" | "tier">("token");
  const [principalMin, setPrincipalMin] = useState("");
  const [principalMax, setPrincipalMax] = useState("");
  const [apr, setApr] = useState("");
  const [maxLtv, setMaxLtv] = useState("");
  const [term, setTerm] = useState<number>(0);
  const [expiryDays, setExpiryDays] = useState("7");
  const [selfLiquidate, setSelfLiquidate] = useState(false);
  const [noClosed, setNoClosed] = useState(false);
  const [parkIdle, setParkIdle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (data && !marketId && data.markets[0]) setMarketId(data.markets[0].id);
    if (data && !term && data.config.terms[0]) setTerm(data.config.terms.includes(2_592_000) ? 2_592_000 : data.config.terms[0]);
  }, [data, marketId, term]);

  useEffect(() => {
    if (!target) return;
    setMarketId(target.market_id);
    setScope("token");
    setTerm(target.term_seconds);
    setPrincipalMax(target.principal);
    setApr((target.max_apr_bps / 100).toFixed(2));
  }, [target]);

  const m = data?.markets.find((x) => x.id === marketId) ?? null;
  const tierCeilingHint = m ? fmtBps(m.max_ltv_bps, 0) : "";
  useEffect(() => {
    if (m && !maxLtv) setMaxLtv((m.max_ltv_bps / 100).toFixed(0));
  }, [m, maxLtv]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m || !data || !userId || !walletAddress) return;
    setError(null);
    setDone(null);
    const max = num(principalMax);
    const min = num(principalMin);
    if (max <= 0) return setError("Set a maximum principal first.");
    if (min > max) return setError("The minimum fill is larger than the maximum principal.");
    const aprBps = Math.round(num(apr) * 100);
    const maxLtvBps = Math.round(num(maxLtv) * 100);
    const tierCeiling = fmtBps(m.max_ltv_bps, 0);
    if (maxLtvBps > m.max_ltv_bps) return setError(`Max LTV is capped at this tier's ceiling, ${tierCeiling}.`);
    setBusy(true);
    try {
      const expiry = new Date(Date.now() + Math.max(1, num(expiryDays)) * 86_400_000);
      const nonce = randomNonce();
      const salt = randomBytes32();
      const flags =
        (selfLiquidate ? OFFER_FLAGS.SELF_LIQUIDATE : 0) |
        (noClosed ? OFFER_FLAGS.NO_CLOSED_MARKET_LIQUIDATION : 0) |
        (parkIdle ? OFFER_FLAGS.PARK_IDLE : 0);
      const requestId = (target?.request_hash as Hex | null) ?? ZERO_BYTES32;
      const message = buildOfferMessage({
        maker: walletAddress as Address,
        market: m,
        scope,
        principalMin: principalMin || "0",
        principalMax,
        aprBps,
        maxLtvBps,
        termSeconds: term,
        expiry,
        nonce,
        salt,
        requestId,
        flags,
      });
      const verifying = deskAddress(data.config);
      const offerHash = hashOffer(platformEnv.chainId, verifying, message);
      const { signature } = await signTypedData(toPrivyTypedData(offerTypedData(platformEnv.chainId, verifying, message)), {
        address: walletAddress,
      });
      await insertOffer(api, {
        maker_address: walletAddress,
        market_id: m.id,
        side: "lend",
        scope,
        tier: scope === "tier" ? m.tier : null,
        principal_min: principalMin || "0",
        principal_max: principalMax,
        apr_bps: aprBps,
        max_ltv_bps: maxLtvBps,
        term_seconds: term,
        expiry: expiry.toISOString(),
        nonce: nonce.toString(),
        salt,
        request_id: target?.id ?? null,
        flags,
        offer_hash: offerHash,
        signature,
      });
      setDone(target ? "Your targeted offer is signed and on the book." : "Your standing offer is signed and live on the book.");
      setPrincipalMax("");
      setPrincipalMin("");
      clearTarget();
      await market.reload();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Panel><Skeleton rows={8} /></Panel>;

  return (
    <Panel className="card-accent">
      <PanelHeader
        eyebrow={target ? "Targeted offer" : "Standing offer"}
        title={target ? `Answer ${shortAddress(target.borrower_address)}'s request` : "Leave a standing offer"}
        description={target ? undefined : "Signed once, filled by matching whenever a request fits your terms."}
        action={
          target ? (
            <Button variant="ghost" className="btn-sm" onClick={clearTarget}>
              Back to standing
            </Button>
          ) : undefined
        }
      />
      <form onSubmit={submit} className="space-y-6">
        {target && marketById[target.market_id] && (
          <div className="flex items-center gap-3 rounded-2xl bg-lagoon-faint p-3 ring-1 ring-lagoon-line">
            <TokenAvatar symbol={marketById[target.market_id].collateral_symbol} size={34} />
            <p className="text-[13px] leading-snug text-navy">
              Answers a <span className="font-semibold">{fmtMoney(target.principal, marketById[target.market_id].loan_symbol, 0)}</span> request capped at{" "}
              <span className="font-semibold">{fmtBps(target.max_apr_bps)}</span> over {fmtTerm(target.term_seconds)}.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Collateral market">
            <Select value={marketId} disabled={!!target} onChange={(e) => setMarketId(e.target.value)}>
              {data.markets.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.collateral_symbol}, tier {x.tier_label}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-medium text-navy">Scope</p>
            <Segmented
              label="Scope"
              value={scope}
              disabled={!!target}
              onChange={setScope}
              options={[
                { value: "token", label: "This token" },
                { value: "tier", label: m ? `All of tier ${m.tier_label}` : "Whole tier" },
              ]}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Most you will lend">
            <Input inputMode="decimal" placeholder="10000" value={principalMax} onChange={(e) => setPrincipalMax(e.target.value)} suffix={m?.loan_symbol} />
          </Field>
          <Field label="Smallest slice" hint="The least you are willing to fund">
            <Input inputMode="decimal" placeholder="1000" value={principalMin} onChange={(e) => setPrincipalMin(e.target.value)} suffix={m?.loan_symbol} />
          </Field>
        </div>

        <div>
          <p className="mb-2.5 text-[13px] font-medium text-navy">Term</p>
          <Segmented label="Term" value={term} disabled={!!target} onChange={setTerm} options={data.config.terms.map((t) => ({ value: t, label: fmtTerm(t) }))} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Your APR">
            <Input inputMode="decimal" placeholder="8.50" value={apr} onChange={(e) => setApr(e.target.value)} suffix="%" />
          </Field>
          <Field label="Max LTV" hint={m ? `Tier ceiling ${tierCeilingHint}` : undefined}>
            <Input inputMode="decimal" value={maxLtv} onChange={(e) => setMaxLtv(e.target.value)} suffix="%" />
          </Field>
          <Field label="Expires in">
            <Input inputMode="numeric" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} suffix="days" />
          </Field>
        </div>

        <div className="divide-y divide-line-soft rounded-[20px] bg-haze px-4 py-1">
          <Toggle label="Receive collateral in kind" hint="If the loan is liquidated, be paid in collateral at the oracle price instead of waiting on auction proceeds." checked={selfLiquidate} onChange={setSelfLiquidate} />
          <Toggle label="Skip closed-market liquidation" hint="Keep your slice out of any auction started while equity markets are shut. You carry the gap risk." checked={noClosed} onChange={setNoClosed} />
          <Toggle label="Park capital while idle" hint="Unmatched USDG earns in the whitelisted Morpho vault until a fill draws it." checked={parkIdle} onChange={setParkIdle} />
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        {done && <Notice tone="success">{done}</Notice>}
        <Button type="submit" disabled={busy || !walletAddress} className="btn-lg w-full">
          <PenLine className="size-4" aria-hidden="true" />
          {busy ? "Signing…" : "Sign the offer"}
        </Button>
        <p className="text-center text-[12px] text-fog">Free to sign, withdrawable at any time, and filled only up to the amount you set.</p>
      </form>
    </Panel>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <Switch label={label} hint={hint} checked={checked} onChange={onChange} />;
}

function MyOffers({ market }: { market: ReturnType<typeof useMarketData> }) {
  const { db, api, userId } = useSession();
  const { marketById } = market;
  const mine = useAsync(() => (userId ? getMyOffers(db, userId) : Promise.resolve([])), [db, userId, market.data]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancel = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await cancelOffer(api, id);
      await mine.reload();
      await market.reload();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Panel>
      <PanelHeader
        eyebrow="Your offers"
        title="Live and past offers"
        description="Cancel takes an offer off the book at once, so matching stops using it. The signature itself stays valid until its expiry passes or its nonce is retired on QuoteBook."
      />
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      {mine.loading && !mine.data ? (
        <Skeleton />
      ) : !mine.data || mine.data.length === 0 ? (
        <EmptyState title="No offers on the book" body="Leave a standing offer and matching picks it up as requests arrive, or answer one from the list above." />
      ) : (
        <ul className="space-y-2.5">
          {mine.data.map((o) => {
            const m = marketById[o.market_id];
            const max = num(o.principal_max);
            const filled = num(o.filled);
            const remaining = max - filled;
            const open = o.status === "open";
            return (
              <li key={o.id} className={cn("rounded-[20px] border p-4", open ? "border-line bg-white" : "border-line-soft bg-canvas/60")}>
                <div className="flex items-center gap-3">
                  {m && <TokenAvatar symbol={m.collateral_symbol} size={36} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold text-navy">{o.scope === "tier" ? `Tier ${m?.tier_label ?? o.tier}` : m?.collateral_symbol ?? "…"}</span>
                      {o.request_id && <Badge tone="lagoon">targeted</Badge>}
                    </div>
                    <div className="mt-0.5 text-[12px] text-fog">
                      {fmtTerm(o.term_seconds)}
                      {open && ` · expires in ${fmtCountdown(o.expiry)}`}
                    </div>
                  </div>
                  <span className="readout rounded-full bg-lagoon-soft px-2.5 py-1 text-[12px] font-semibold text-lagoon-deep">{fmtBps(o.apr_bps)}</span>
                  <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Meter value={max > 0 ? (filled / max) * 100 : 0} />
                  <span className="readout shrink-0 text-[12px] text-tide">
                    {fmtMoney(remaining, "", 0)} of {fmtMoney(max, m?.loan_symbol ?? "", 0)} left
                  </span>
                  {open && (
                    <Button variant="ghost" className="btn-sm shrink-0" disabled={busyId === o.id} onClick={() => void cancel(o.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
