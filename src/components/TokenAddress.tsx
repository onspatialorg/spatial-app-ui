"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** The $SPATIAL contract address as a chip, with a button that copies the full address. */
export function TokenAddress({ address, symbol = "$SPATIAL", className }: { address: string; symbol?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  if (!address) return null;
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      window.prompt("Copy the token address", address);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl border border-line bg-white p-1 pl-3 shadow-sm", className)}>
      <span className="caption text-fog">{symbol}</span>
      <span className="readout mx-1.5 text-[13px] text-navy" title={address}>
        {short}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-live="polite"
        aria-label={copied ? "Token address copied" : "Copy the token address"}
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold transition-colors",
          copied ? "bg-leaf-soft text-leaf-deep" : "bg-haze text-tide hover:bg-lagoon-soft hover:text-lagoon"
        )}
      >
        {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
