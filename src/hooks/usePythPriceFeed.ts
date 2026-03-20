import { useState, useEffect, useRef } from 'react';

// Pyth Hermes public endpoint — no API key required
const HERMES_URL = 'https://hermes.pyth.network/v2/updates/price/latest';

// SOL/USD price feed ID
const SOL_USD_FEED_ID = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

// Price is stale if older than 30 seconds
const STALE_THRESHOLD_MS = 30_000;

// Poll every 10 seconds
const POLL_INTERVAL_MS = 10_000;

export interface PriceFeedData {
  price: number;
  confidence: number;
  lastUpdated: Date | null;
  isStale: boolean;
  error: string | null;
}

export const usePythPriceFeed = (): PriceFeedData => {
  const [data, setData] = useState<PriceFeedData>({
    price: 0,
    confidence: 0,
    lastUpdated: null,
    isStale: false,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrice = async () => {
    try {
      const res = await fetch(
        `${HERMES_URL}?ids[]=${SOL_USD_FEED_ID}`,
        { headers: { Accept: 'application/json' } }
      );

      if (!res.ok) {
        throw new Error(`Hermes error ${res.status}`);
      }

      const json = await res.json();
      const feed = json?.parsed?.[0];

      if (!feed?.price) {
        throw new Error('Invalid Pyth response');
      }

      // Pyth returns price as integer + exponent
      // e.g. price = 18542000000, expo = -8 → $185.42
      const rawPrice = Number(feed.price.price);
      const expo = Number(feed.price.expo);
      const price = rawPrice * Math.pow(10, expo);

      const rawConf = Number(feed.price.conf);
      const confidence = rawConf * Math.pow(10, expo);

      // publish_time is Unix seconds
      const publishTime = Number(feed.price.publish_time);
      const lastUpdated = new Date(publishTime * 1000);

      const isStale = Date.now() - lastUpdated.getTime() > STALE_THRESHOLD_MS;

      setData({ price, confidence, lastUpdated, isStale, error: null });
    } catch (err) {
      setData(prev => ({
        ...prev,
        isStale: true,
        error: err instanceof Error ? err.message : 'Price feed error',
      }));
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchPrice();

    // Then poll every 10s
    intervalRef.current = setInterval(fetchPrice, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return data;
};

export default usePythPriceFeed;
