import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface QueryCacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleTime?: number; // Time before data is considered stale
  cacheKey?: string;
}

// Global cache to persist across component unmounts
const globalCache = new Map<string, CacheEntry<any>>();

export function useQueryCache<T>(
  queryFn: () => Promise<T>,
  dependencies: any[],
  options: QueryCacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, staleTime = 30 * 1000, cacheKey } = options; // 5 min TTL, 30s stale time
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const key = cacheKey || `query_${JSON.stringify(dependencies)}`;

  const getCachedData = useCallback(() => {
    const cached = globalCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.expiry) {
      globalCache.delete(key);
      return null;
    }
    
    const isStaleData = now - cached.timestamp > staleTime;
    return { ...cached, isStale: isStaleData };
  }, [key, staleTime]);

  const setCachedData = useCallback((data: T) => {
    const now = Date.now();
    globalCache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl,
    });
  }, [key, ttl]);

  const fetchData = useCallback(async (force = false) => {
    // Check cache first
    const cached = getCachedData();
    if (cached && !force) {
      setData(cached.data);
      setIsStale(cached.isStale);
      setError(null);
      
      // If data is stale, fetch in background
      if (cached.isStale) {
        setIsLoading(true);
      } else {
        return;
      }
    } else {
      setIsLoading(true);
      setData(null);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const result = await queryFn();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      setError(null);
      setIsStale(false);
      setCachedData(result);
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // If we have cached data, keep it despite the error
      const cached = getCachedData();
      if (cached) {
        setData(cached.data);
        setIsStale(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, getCachedData, setCachedData]);

  const invalidateQuery = useCallback(() => {
    globalCache.delete(key);
    fetchData(true);
  }, [key, fetchData]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    isLoading,
    error,
    isStale,
    refetch,
    invalidateQuery,
  };
}

// Hook for batch loading multiple queries
export function useBatchQuery<T extends Record<string, () => Promise<any>>>(
  queries: T,
  options: QueryCacheOptions = {}
): {
  [K in keyof T]: {
    data: Awaited<ReturnType<T[K]>> | null;
    isLoading: boolean;
    error: Error | null;
    isStale: boolean;
  };
} & {
  refetchAll: () => void;
  invalidateAll: () => void;
} {
  const [results, setResults] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, Error | null>>({});
  const [staleStates, setStaleStates] = useState<Record<string, boolean>>({});

  const queryKeys = Object.keys(queries);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const fetchQuery = useCallback(async (key: string, queryFn: () => Promise<any>, force = false) => {
    const cacheKey = `batch_${key}`;
    const cached = globalCache.get(cacheKey);
    const now = Date.now();

    // Check cache
    if (cached && !force && now <= cached.expiry) {
      const isStaleData = now - cached.timestamp > (options.staleTime || 30000);
      setResults((prev: any) => ({ ...prev, [key]: cached.data }));
      setStaleStates((prev: any) => ({ ...prev, [key]: isStaleData }));
      setErrors((prev: any) => ({ ...prev, [key]: null }));
      
      if (!isStaleData) {
        return;
      }
    }

    setLoadingStates((prev: any) => ({ ...prev, [key]: true }));

    // Cancel previous request
    const existingController = abortControllersRef.current.get(key);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    abortControllersRef.current.set(key, controller);

    try {
      const result = await queryFn();
      
      if (controller.signal.aborted) return;

      setResults((prev: any) => ({ ...prev, [key]: result }));
      setErrors((prev: any) => ({ ...prev, [key]: null }));
      setStaleStates((prev: any) => ({ ...prev, [key]: false }));

      // Cache the result
      globalCache.set(cacheKey, {
        data: result,
        timestamp: now,
        expiry: now + (options.ttl || 5 * 60 * 1000),
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      
      const err = error instanceof Error ? error : new Error('Unknown error');
      setErrors((prev: any) => ({ ...prev, [key]: err }));
    } finally {
      setLoadingStates((prev: any) => ({ ...prev, [key]: false }));
      abortControllersRef.current.delete(key);
    }
  }, [options.staleTime, options.ttl]);

  const refetchAll = useCallback(() => {
    queryKeys.forEach(key => {
      fetchQuery(key, queries[key], true);
    });
  }, [queryKeys, queries, fetchQuery]);

  const invalidateAll = useCallback(() => {
    queryKeys.forEach(key => {
      globalCache.delete(`batch_${key}`);
    });
    refetchAll();
  }, [queryKeys, refetchAll]);

  useEffect(() => {
    // Fetch all queries
    queryKeys.forEach(key => {
      fetchQuery(key, queries[key]);
    });

    return () => {
      // Cleanup abort controllers
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, [queryKeys, queries, fetchQuery]);

  // Transform results into the expected format
  const transformedResults = queryKeys.reduce((acc, key) => {
    acc[key] = {
      data: results[key] || null,
      isLoading: loadingStates[key] || false,
      error: errors[key] || null,
      isStale: staleStates[key] || false,
    };
    return acc;
  }, {} as any);

  return {
    ...transformedResults,
    refetchAll,
    invalidateAll,
  };
}

// Utility to clear all cache
export const clearQueryCache = () => {
  globalCache.clear();
};

// Utility to get cache size
export const getCacheSize = () => {
  return globalCache.size;
};
