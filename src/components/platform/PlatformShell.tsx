"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Briefcase, Coins, HandCoins, LayoutGrid, LogOut, Settings, ShieldCheck, Telescope } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Blockie } from "@/components/Blockie";
import { useSession } from "./PlatformProviders";
import { shortAddress } from "@/lib/platform/format";
import { platformEnv } from "@/lib/platform/env";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/platform", label: "Overview", exact: true, icon: LayoutGrid },
  { href: "/platform/borrow", label: "Borrow", icon: HandCoins },
  { href: "/platform/lend", label: "Lend", icon: Coins },
  { href: "/platform/positions", label: "Positions", icon: Briefcase },
  { href: "/platform/explorer", label: "Explorer", icon: Telescope },
  { href: "/platform/settings", label: "Settings", icon: Settings },
] as const;

/* The four pages used every day get the phone's bottom bar; Explorer and Settings sit in the header there */
const BOTTOM = NAV.slice(0, 4);

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, authenticated, walletAddress, email, login, logout, sessionError } = useSession();

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  const iconButton =
    "inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-tide transition-colors hover:bg-haze hover:text-navy";

  const account = !ready ? (
    <div className="h-10 w-36 animate-pulse rounded-full bg-haze" />
  ) : authenticated ? (
    <div className="flex items-center gap-1">
      <Link href="/platform/explorer" aria-label="Explorer" className={cn(iconButton, "lg:hidden")}>
        <Telescope className="size-[18px]" />
      </Link>
      <Link
        href="/platform/settings"
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-haze sm:pr-3.5"
        title={walletAddress ?? undefined}
      >
        <span className="size-8 overflow-hidden rounded-full ring-2 ring-white">
          {walletAddress ? <Blockie address={walletAddress} className="block size-full" /> : <span className="block size-full bg-haze-2" />}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="readout block text-[12.5px] font-semibold leading-tight text-navy">{shortAddress(walletAddress)}</span>
          <span className="block max-w-[150px] truncate text-[11.5px] leading-tight text-fog">{email ?? platformEnv.chainName}</span>
        </span>
      </Link>
      <button type="button" onClick={() => void logout()} aria-label="Sign out" title="Sign out" className={iconButton}>
        <LogOut className="size-[18px]" />
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-1.5">
      <Link href="/platform/explorer" aria-label="Explorer" className={cn(iconButton, "lg:hidden")}>
        <Telescope className="size-[18px]" />
      </Link>
      <button type="button" onClick={login} className="btn btn-primary btn-sm cursor-pointer">
        Sign in
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
        {/* Three equal columns put the navigation at the exact centre of the bar */}
        <div className="glass mx-auto grid h-[60px] max-w-[1360px] grid-cols-[1fr_auto] items-center gap-3 rounded-full pl-4 pr-2 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-3 justify-self-start">
            <Logo size={28} href="/platform" />
          </div>

          <nav aria-label="Platform" className="hidden items-center gap-0.5 rounded-full bg-haze/80 p-1 lg:flex">
            {NAV.map((item) => {
              const active = isActive(item.href, "exact" in item && item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-all",
                    active ? "bg-white text-navy shadow-[0_1px_3px_rgb(11_37_48/0.12)]" : "text-tide hover:text-navy"
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-lagoon" : "text-fog")} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="justify-self-end">{account}</div>
        </div>
      </header>

      <main className="flex-1 pb-28 lg:pb-6">
        {sessionError && (
          <div className="mx-auto max-w-[1360px] px-4 pt-6 md:px-6">
            <div className="rounded-2xl bg-rose-soft px-4 py-3 text-[13.5px] text-rose-deep">{sessionError}</div>
          </div>
        )}
        {children}
      </main>

      {/* Phones and tablets: a floating bar with the four everyday pages */}
      <nav aria-label="Platform" className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="glass mx-auto flex max-w-[440px] items-stretch justify-around rounded-[26px] p-1.5">
          {BOTTOM.map((item) => {
            const active = isActive(item.href, "exact" in item && item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-[20px] py-2 text-[11px] font-semibold transition-colors",
                  active ? "bg-white text-navy shadow-[0_1px_3px_rgb(11_37_48/0.1)]" : "text-fog hover:text-navy"
                )}
              >
                <Icon className={cn("size-[19px]", active && "text-lagoon")} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <footer className="mt-auto hidden lg:block">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-6 pb-6 pt-2 text-[12.5px] text-fog">
          <Link href="/" className="transition-colors hover:text-lagoon-deep">
            Spatial · {SITE.domain}
          </Link>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-lagoon" aria-hidden="true" />
            Fills, repayments and auctions all settle on {platformEnv.chainName}
          </span>
        </div>
      </footer>
    </div>
  );
}

/** Gate that asks the visitor to sign in before showing account-specific content. */
export function RequireAuth({ children, title, body }: { children: React.ReactNode; title?: string; body?: string }) {
  const { ready, authenticated, login } = useSession();
  if (!ready) return <div className="h-64 animate-pulse rounded-[24px] bg-haze" />;
  if (!authenticated) {
    return (
      <div className="relative isolate mx-auto max-w-2xl overflow-hidden rounded-[28px] border border-line bg-white px-6 py-12 text-center shadow-[var(--lift)] md:px-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgb(150_224_222/0.45),transparent_70%)]" />
        <Image src="/images/logo-mark-lg.png" alt="" width={84} height={84} className="mark-glow animate-float mx-auto" />
        <h2 className="mx-auto mt-6 max-w-md text-[28px] leading-[1.1] md:text-[32px]">{title ?? "Sign in to carry on"}</h2>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-tide">
          {body ??
            "Email, a social login or any EVM wallet will do. If you arrive without a wallet on Robinhood Chain, one is created for you, and that address is the one your offers and requests carry."}
        </p>
        <button type="button" onClick={login} className="btn btn-primary btn-lg mt-8 cursor-pointer">
          Sign in
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </button>
        <p className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-fog">
          <ShieldCheck className="size-3.5 text-lagoon" aria-hidden="true" />
          Signing in never moves funds. Every transfer needs your signature.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
