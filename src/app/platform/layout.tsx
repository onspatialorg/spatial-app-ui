import type { Metadata } from "next";
import { PlatformProviders } from "@/components/platform/PlatformProviders";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { SetupNotice } from "@/components/platform/SetupNotice";
import { missingPlatformEnv } from "@/lib/platform/env";

export const metadata: Metadata = {
  title: "Platform",
  description: "Take a USDG loan against tokenized stocks, or lend at the rate you choose, on Robinhood Chain.",
  robots: { index: false, follow: false },
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const missing = missingPlatformEnv();
  if (missing.length > 0) return <SetupNotice missing={missing} />;
  return (
    <PlatformProviders>
      <PlatformShell>{children}</PlatformShell>
    </PlatformProviders>
  );
}
