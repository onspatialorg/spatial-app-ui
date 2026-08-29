"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { GitHubIcon, XIcon } from "@/components/icons";
import { NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const iconLink =
    "inline-flex size-9 items-center justify-center rounded-full text-tide transition-colors hover:bg-haze hover:text-lagoon-deep";

  return (
    <header className="sticky top-2 z-40 w-full">
      <div className="container">
        <div className="glass grid h-[60px] grid-cols-[1fr_auto] items-center rounded-full pl-4 pr-2 xl:grid-cols-[1fr_auto_1fr]">
          <Logo size={30} />

          <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-[14px] font-medium text-tide transition-colors hover:bg-haze hover:text-navy"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={SITE.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full px-3.5 py-2 text-[14px] font-medium text-tide transition-colors hover:bg-haze hover:text-navy"
            >
              Docs
              <ArrowUpRight className="size-3 text-fog" aria-hidden="true" />
            </a>
          </nav>

          <div className="hidden items-center justify-self-end gap-1 xl:flex">
            <a href={SITE.xUrl} target="_blank" rel="noopener noreferrer" aria-label="Spatial on X" className={iconLink}>
              <XIcon className="size-3.5" />
            </a>
            <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="Spatial on GitHub" className={iconLink}>
              <GitHubIcon className="size-4" />
            </a>
            <Link href={SITE.appHref} className="btn btn-primary btn-sm ml-2">
              Launch the app
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            aria-label={open ? "Close the menu" : "Open the menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-11 cursor-pointer items-center justify-center justify-self-end rounded-full bg-haze text-navy transition-colors hover:bg-haze-2 xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Full-screen navigation on small screens */}
      <div
        id="mobile-nav"
        className={cn("fixed inset-x-0 top-[80px] bottom-0 z-50 overflow-y-auto bg-canvas/95 backdrop-blur-xl xl:hidden", open ? "block" : "hidden")}
      >
        <div className="container flex min-h-full flex-col pb-10 pt-4">
          <nav aria-label="Mobile" className="card flex flex-col p-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-4 font-display text-[22px] text-navy transition-colors hover:bg-haze hover:text-lagoon"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={SITE.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-4 font-display text-[22px] text-navy transition-colors hover:bg-haze hover:text-lagoon"
            >
              Docs
              <BookOpen className="size-5 text-fog" aria-hidden="true" />
            </a>
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <Link href={SITE.appHref} className="btn btn-primary btn-lg w-full" onClick={() => setOpen(false)}>
              Launch the app
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <a href={SITE.xUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
                <XIcon className="size-3.5" />
                {SITE.xHandle}
              </a>
              <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
                <GitHubIcon className="size-4" />
                GitHub
              </a>
            </div>
          </div>
          <p className="mt-auto pt-10 text-[12px] text-fog">
            {SITE.domain} · chain {SITE.chainId}
          </p>
        </div>
      </div>
    </header>
  );
}
