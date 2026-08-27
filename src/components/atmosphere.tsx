import { cn } from "@/lib/utils";

/** Two drifting washes of aqua and ice with grain over them. Position the parent relatively. */
export function Aurora({ className, faint = false }: { className?: string; faint?: boolean }) {
  return (
    <>
      <div aria-hidden="true" className={cn("aurora -z-10", faint && "aurora-faint", className)} />
      <div aria-hidden="true" className="grain -z-10" />
    </>
  );
}

/** The quiet dot grid behind instrument-like sections. */
export function DotGrid({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("dotgrid absolute inset-0 -z-10", className)} />;
}

/**
 * Concentric hairline orbits around a point, echoing the sphere. One arc with
 * a small bead turns slowly; the rest stay put.
 */
export function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 640" aria-hidden="true" className={cn("block", className)}>
      <circle cx="320" cy="320" r="150" fill="none" stroke="#0a8782" strokeOpacity="0.16" strokeWidth="1.25" />
      <circle cx="320" cy="320" r="214" fill="none" stroke="#0a8782" strokeOpacity="0.12" strokeWidth="1.25" />
      <circle cx="320" cy="320" r="296" fill="none" stroke="#0a8782" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2 9" />
      <g className="animate-spin-slow" style={{ transformOrigin: "320px 320px" }}>
        <circle cx="320" cy="320" r="214" fill="none" stroke="#14b7ad" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="220 1125" strokeLinecap="round" />
        <circle cx="534" cy="320" r="5" fill="#14b7ad" />
      </g>
    </svg>
  );
}

/** A small accent dot, used as a list marker. */
export function Spark({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block size-1.5 shrink-0 rounded-full bg-aqua", className)} />;
}
