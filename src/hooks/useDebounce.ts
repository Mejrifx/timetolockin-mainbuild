import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 * Prevents rapid successive calls that can cause performance issues
 */
export function useDebounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    }) as T,
    [func, delay]
  );
}

/**
 * Custom hook for throttling function calls
 * Ensures function is called at most once per specified interval
 */
export function useThrottle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        func(...args);
      }
    }) as T,
    [func, delay]
  );
}
