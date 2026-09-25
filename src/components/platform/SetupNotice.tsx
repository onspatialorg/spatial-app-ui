import Link from "next/link";
import { Logo } from "@/components/Logo";

const code = "rounded-md bg-haze px-1.5 py-0.5 font-mono text-[13px] font-medium text-lagoon-deep";

export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="card card-accent max-w-xl p-8">
        <Logo size={30} />
        <p className="eyebrow eyebrow-pill mt-8">Setup needed</p>
        <h1 className="mt-3 text-[24px] leading-snug">A few environment variables are still missing</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-tide">
          Privy and Supabase supply the platform&apos;s configuration. Put the values below in <code className={code}>.env.local</code>,
          apply <code className={code}>supabase/schema.sql</code> followed by <code className={code}>supabase/seed.sql</code>, and start
          the dev server again.
        </p>
        <ul className="mt-4 space-y-1 font-mono text-[13px] text-navy">
          {missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="mt-6 text-[14px] leading-relaxed text-fog">
          The complete walkthrough lives in <code className={code}>supabase/README.md</code>. You can also{" "}
          <Link href="/" className="text-lagoon underline-offset-4 hover:underline">
            go back to the front page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
