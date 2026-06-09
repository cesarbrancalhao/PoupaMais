import { useState, useEffect, useCallback } from 'react';
import { StatisticsQueryParams } from '@/services/statistics.service';
import { ApiError } from '@/services';

interface UseStatisticsQueryOptions<T> {
  fetcher: (params?: StatisticsQueryParams) => Promise<T>;
  params?: StatisticsQueryParams;
  enabled?: boolean;
}

export function useStatisticsQuery<T>({
  fetcher,
  params,
  enabled = true,
}: UseStatisticsQueryOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const refetch = useCallback(() => setRetry((r) => r + 1), []);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher(params)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: ApiError) => {
        if (!cancelled) {
          if (err && (err.status === 401 || err.status === 403)) {
            setLoading(false);
            return;
          }
          setError(err.message || 'Error loading data');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // paramsKey stands in for params to compare by content, not identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, paramsKey, enabled, retry]);

  return { data, loading, error, refetch };
}
