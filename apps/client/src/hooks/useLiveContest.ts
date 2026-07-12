import { useState, useEffect } from 'react';

import api from '../lib/axios';

interface Contest {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  type?: 'NORMAL' | 'REVERSE_CODING';
}

interface LiveContestResponse {
  isLive: boolean;
  contest?: Contest;
  nextContest?: Contest | null;
}

export function useLiveContest() {
  const [isLive, setIsLive] = useState(false);
  const [contest, setContest] = useState<Contest | null>(null);
  const [nextContest, setNextContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const { data } = await api.get<LiveContestResponse>('/api/contests/live');
        if (mounted) {
          setIsLive(data.isLive);
          setContest(data.contest || null);
          setNextContest(data.nextContest || null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch live contest status', err);
        if (mounted) setIsLoading(false);
      }
    };

    fetchStatus();

    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isLive, contest, nextContest, isLoading };
}
