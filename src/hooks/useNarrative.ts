import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export interface Backing {
  id: string;
  narrative_id: string;
  wallet_address: string;
  amount_sol: number;
  amount_skr: number;
  tx_signature: string | null;
  token_type: string;
  created_at: string;
}

export interface Narrative {
  id: string;
  wallet_address: string;
  title: string;
  thesis: string;
  summary: string;
  status: string;
  challenge_window_closes_at?: string;
  is_final?: boolean;
  confidence?: number;
  sources_used?: string[];
  resolved_at?: string;
  score: number;
  sol_backed: number;
  backers: number;
  days_remaining: number;
  created_at: string;
  kit_hooks: string[] | null;
  kit_article: string | null;
  kit_thread: string | null;
  oracle_status: string;
  resolution: string | null;
  total_backed_sol: number;
  total_backed_skr: number;
  backer_count: number;
  deadline_at: string | null;
}

export function useNarrative(narrativeId: string) {
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [backers, setBackers] = useState<Backing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!narrativeId) return;
    setLoading(true);
    setError(null);
    try {
      const [narrativeRes, backersRes] = await Promise.all([
        axios.get(`${API_URL}/v1/narratives/${narrativeId}`),
        axios.get(`${API_URL}/v1/narratives/${narrativeId}/backers`),
      ]);
      setNarrative(narrativeRes.data.narrative ?? narrativeRes.data);
      setBackers(backersRes.data.backers ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load narrative');
    } finally {
      setLoading(false);
    }
  }, [narrativeId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { narrative, backers, loading, error, refetch: fetch };
}
