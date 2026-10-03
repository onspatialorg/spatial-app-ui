"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/platform/PlatformProviders";
import { RequireAuth } from "@/components/platform/PlatformShell";
import { useAsync } from "@/components/platform/usePlatformData";
import { Badge, Button, Console, ConsoleHeader, Field, Input, Notice, Panel, PanelHeader, Skeleton } from "@/components/platform/ui";
import { Blockie } from "@/components/Blockie";
import { Briefcase, Gavel, HandCoins, Radio, UserRound, type LucideIcon } from "lucide-react";
import { shortAddress } from "@/lib/platform/format";
import { getMyAttestations, upsertProfile } from "@/lib/platform/queries";
import { fmtDate, friendlyError } from "@/lib/platform/format";
import { platformEnv } from "@/lib/platform/env";

export default function SettingsPage() {
  return (
    <>
      <ConsoleHeader
        eyebrow="Settings"
        title="Profile and eligibility."
        description="The name you go by here, the wallet that signs your offers and requests, and the roles the registry has attested for that wallet."
      />
      <Console>
        <RequireAuth title="Sign in to open your settings">
          <Settings />
        </RequireAuth>
      </Console>
    </>
  );
}

const ROLES = ["BORROWER", "LENDER_PROFESSIONAL", "LENDER_RETAIL", "LIQUIDATOR", "RELAYER"] as const;

const ROLE_INFO: Record<(typeof ROLES)[number], { title: string; body: string; icon: LucideIcon }> = {
  BORROWER: { title: "Borrower", body: "Post requests and draw USDG against Stock Tokens.", icon: HandCoins },
  LENDER_PROFESSIONAL: { title: "Professional lender", body: "Fund slices as a professional client, such as a credit fund or market maker.", icon: Briefcase },
  LENDER_RETAIL: { title: "Retail lender", body: "Fund slices in markets where regulation permits retail lending.", icon: UserRound },
  LIQUIDATOR: { title: "Liquidator", body: "Buy auctioned collateral, or receive it when a loan settles in kind.", icon: Gavel },
  RELAYER: { title: "Relayer", body: "Send a borrower's signed request on their behalf.", icon: Radio },
};

function Settings() {
  const { api, userId, walletAddress, email, profile, refreshProfile } = useSession();
  const attestations = useAsync(() => getMyAttestations(api), [api, userId]);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      await upsertProfile(api, { display_name: displayName || null, wallet_address: walletAddress, email });
      await refreshProfile();
      setMsg("Your profile is up to date.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel>
        <div className="flex items-center gap-4">
          <span className="size-16 shrink-0 overflow-hidden rounded-full ring-4 ring-lagoon-soft">
            {walletAddress ? <Blockie address={walletAddress} className="block size-full" /> : <span className="block size-full bg-haze-2" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[22px] leading-tight text-navy">{profile?.display_name || "Your profile"}</p>
            <p className="readout truncate text-[13px] text-fog">{walletAddress ? shortAddress(walletAddress) : "No wallet yet"}</p>
          </div>
        </div>

        <form onSubmit={save} className="mt-6 space-y-4">
          <Field label="Display name" hint="Visible to you alone. On the public book every party appears as an address.">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Wallet">
            <Input value={walletAddress ?? ""} readOnly className="readout text-[13px]" />
          </Field>
          <Field label="Email">
            <Input value={email ?? ""} readOnly />
          </Field>
          <Field label="User id">
            <Input value={userId ?? ""} readOnly className="readout text-[12px]" />
          </Field>
          {msg && <Notice tone="success">{msg}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Eligibility"
          title="Roles attested for this wallet"
          description="The KYC provider issues each attestation once identity, sanctions and residency checks have passed. The registry stores nothing beyond the role, the jurisdiction class and an expiry."
        />
        {attestations.loading && !attestations.data ? (
          <Skeleton rows={5} />
        ) : (
          <ul className="space-y-2">
            {ROLES.map((role) => {
              const a = attestations.data?.find((x) => x.role === role && x.status === "active" && new Date(x.expires_at) > new Date());
              const info = ROLE_INFO[role];
              const Icon = info.icon;
              return (
                <li key={role} className="flex items-center gap-3.5 rounded-[18px] border border-line-soft bg-white p-3.5">
                  <span className={a ? "icon-tile" : "inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-haze text-fog"}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-navy">{info.title}</div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-fog">
                      {a ? `${a.jurisdiction_class ?? "?"}, class ${a.investor_class ?? "?"}, valid until ${fmtDate(a.expires_at)}` : info.body}
                    </div>
                  </div>
                  <Badge tone={a ? "leaf" : "muted"}>{a ? "active" : "not issued"}</Badge>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-5 rounded-2xl bg-haze px-4 py-3 text-[12.5px] leading-relaxed text-tide">
          The issuer writes every attestation through the service role, and the PermissionRegistry on {platformEnv.chainName} carries a mirror of each one. Write to us when you are ready to begin onboarding.
        </p>
      </Panel>
    </div>
  );
}
