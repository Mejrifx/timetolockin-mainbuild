// Performance utility functions

/**
 * Debounce function to limit the rate of function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit function calls to once per interval
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Optimize images by adding performance attributes
 */
export const optimizeImage = (img: HTMLImageElement, priority = false) => {
  img.loading = priority ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.setAttribute('fetchpriority', priority ? 'high' : 'auto');
  img.style.contain = 'layout style paint';
  img.style.willChange = 'opacity';
};

/**
 * Add performance classes to elements
 */
export const addPerformanceClasses = (element: HTMLElement, classes: string[]) => {
  element.classList.add(...classes);
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get device performance tier (rough estimation)
 */
export const getPerformanceTier = (): 'low' | 'medium' | 'high' => {
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  
  if (memory <= 2 || cores <= 2) return 'low';
  if (memory <= 4 || cores <= 4) return 'medium';
  return 'high';
};

/**
 * Optimize text inputs for better performance
 */
export const optimizeTextInput = (input: HTMLInputElement | HTMLTextAreaElement) => {
  input.style.contain = 'layout style';
  input.style.willChange = 'contents';
  
  // Add debounced input handling
  const originalHandler = input.oninput;
  const debouncedHandler = debounce((e: Event) => {
    if (originalHandler) originalHandler.call(input, e as any);
  }, 16); // ~60fps
  
  input.oninput = debouncedHandler;
};

/**
 * Preload critical resources
 */
export const preloadResource = (href: string, as: string, priority = false) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (priority) link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
};

/**
 * Monitor performance metrics
 */
export const monitorPerformance = () => {
  if ('performance' in window) {
    // Monitor LCP
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('LCP:', entry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitor FID
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('FID:', (entry as any).processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Monitor CLS
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          console.log('CLS:', (entry as any).value);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
};
