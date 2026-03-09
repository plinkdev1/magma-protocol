import { useState } from 'react';
export interface PriceFeedData { price: number; confidence: number; lastUpdated: Date | null; isStale: boolean; error: string | null; }
export const usePythPriceFeed = (): PriceFeedData => {
  return { price: 185.42, confidence: 0.12, lastUpdated: new Date(), isStale: false, error: null };
};
export default usePythPriceFeed;