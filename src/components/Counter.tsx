"use client";

import { useEffect, useRef, useState } from "react";

interface CounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * An instrument that counts up to its value when it first comes into view.
 * The final figure is rendered on the server, so the number is correct even
 * before any script runs; the count-up only replaces it once it starts.
 */
export function Counter({ value, decimals = 0, prefix = "", suffix = "", duration = 1600, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started) return;
        started = true;
        io.disconnect();
        const t0 = performance.now();
        const tick = () => {
          const p = Math.min(1, (performance.now() - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(p < 1 ? value * eased : null);
          if (p < 1) timer = window.setTimeout(tick, 16);
        };
        timer = window.setTimeout(tick, 0);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [value, duration]);

  const n = shown ?? value;
  return (
    <span ref={ref} className={className}>
      {prefix}
      {n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
