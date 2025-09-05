import { useState, useEffect, useCallback, useMemo } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const totalItemCount = items.length;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItemCount - 1,
    startIndex + visibleItemCount + overscan * 2
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = totalItemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

// Hook for virtual scrolling with dynamic heights
export function useVariableVirtualization<T>(
  items: T[],
  estimateSize: (index: number) => number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [measurements, setMeasurements] = useState<Record<number, number>>({});

  const getItemSize = useCallback((index: number) => {
    return measurements[index] ?? estimateSize(index);
  }, [measurements, estimateSize]);

  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    let totalHeight = 0;
    let startIndex = 0;
    let endIndex = 0;
    let offsetY = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const size = getItemSize(i);
      if (totalHeight + size > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        offsetY = totalHeight - (i - startIndex) * estimateSize(0);
        break;
      }
      totalHeight += size;
    }

    // Find end index
    let visibleHeight = 0;
    for (let i = startIndex; i < items.length; i++) {
      const size = getItemSize(i);
      visibleHeight += size;
      if (visibleHeight >= containerHeight + overscan * estimateSize(0)) {
        endIndex = i;
        break;
      }
    }
    endIndex = Math.min(items.length - 1, endIndex + overscan);

    // Calculate total height
    totalHeight = 0;
    for (let i = 0; i < items.length; i++) {
      totalHeight += getItemSize(i);
    }

    return { startIndex, endIndex, totalHeight, offsetY };
  }, [items.length, scrollTop, getItemSize, containerHeight, overscan, estimateSize]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const measureItem = useCallback((index: number, size: number) => {
    setMeasurements(prev => ({ ...prev, [index]: size }));
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    measureItem,
    startIndex,
    endIndex,
  };
}
