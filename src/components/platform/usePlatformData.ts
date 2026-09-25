"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSession } from "./PlatformProviders";
import { friendlyError } from "@/lib/platform/format";
import {
  getLatestPrices,
  getMarkets,
  getOpenOffers,
  getOpenRequests,
  getProtocolConfig,
  getStats,
} from "@/lib/platform/queries";
import type { LatestPrice, Market, Offer, BorrowRequest, ProtocolConfig, ProtocolStats } from "@/lib/platform/types";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/** Small async loader keyed on the Supabase client and an explicit dependency list. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

// A shared ticking clock exposed through useSyncExternalStore, so components can read "now" during render
// without calling Date.now() there. One interval serves every subscriber.
const clock = {
  value: Date.now(),
  listeners: new Set<() => void>(),
  timer: null as ReturnType<typeof setInterval> | null,
  subscribe(cb: () => void) {
    clock.listeners.add(cb);
    if (!clock.timer) {
      clock.timer = setInterval(() => {
        clock.value = Date.now();
        clock.listeners.forEach((l) => l());
      }, 30_000);
    }
    return () => {
      clock.listeners.delete(cb);
      if (clock.listeners.size === 0 && clock.timer) {
        clearInterval(clock.timer);
        clock.timer = null;
      }
    };
  },
  get: () => clock.value,
};

/** Wall-clock in milliseconds that refreshes every 30 seconds. */
export function useNow(): number {
  return useSyncExternalStore(clock.subscribe, clock.get, clock.get);
}

export interface MarketData {
  markets: Market[];
  prices: Record<string, LatestPrice>;
  config: ProtocolConfig;
  offers: Offer[];
  requests: BorrowRequest[];
  stats: ProtocolStats | null;
}

/** Everything the platform needs to price and match, loaded together. */
export function useMarketData(): AsyncState<MarketData> & { marketById: Record<string, Market> } {
  const { db } = useSession();
  const state = useAsync<MarketData>(async () => {
    const [markets, prices, config, offers, requests, stats] = await Promise.all([
      getMarkets(db),
      getLatestPrices(db),
      getProtocolConfig(db),
      getOpenOffers(db),
      getOpenRequests(db),
      getStats(db),
    ]);
    return { markets, prices, config, offers, requests, stats };
  }, [db]);
  const marketById = useMemo(
    () => Object.fromEntries((state.data?.markets ?? []).map((m) => [m.id, m])),
    [state.data]
  );
  return { ...state, marketById };
}
