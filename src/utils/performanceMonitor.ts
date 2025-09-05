// Performance monitoring utilities for GM AI Web App
// Tracks Core Web Vitals and custom metrics for 500K+ users

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface WebVital {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private sendInterval: number = 30000; // 30 seconds
  private lastSent: number = 0;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Initialize performance observer
    this.initPerformanceObserver();
    
    // Monitor Core Web Vitals
    this.initWebVitals();
    
    // Monitor custom metrics
    this.initCustomMetrics();
    
    // Send metrics periodically
    this.startMetricsSender();
    
    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics(true);
    });

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics(true);
      }
    });
  }

  private initPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.duration || entry.startTime,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'layout-shift', 'largest-contentful-paint'] 
      });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private initWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // First Contentful Paint (FCP)
    this.observeFCP();
    
    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  private observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordWebVital({
          name: 'LCP',
          value: lastEntry.startTime,
          delta: lastEntry.startTime,
          id: this.generateId(),
          navigationType: this.getNavigationType(),
        });
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('LCP observation failed:', error);
    }
  }

  private observeFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any; // PerformanceEventTiming
          this.recordWebVital({
            name: 'FID',
            value: fidEntry.processingStart - fidEntry.startTime,
            delta: fidEntry.processingStart - fidEntry.startTime,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('FID observation failed:', error);
    }
  }

  private observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any; // LayoutShift
          if (!clsEntry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (sessionValue && 
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += clsEntry.value;
              sessionEntries.push(clsEntry);
            } else {
              sessionValue = clsEntry.value;
              sessionEntries = [clsEntry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              this.recordWebVital({
                name: 'CLS',
                value: clsValue,
                delta: clsEntry.value,
                id: this.generateId(),
                navigationType: this.getNavigationType(),
              });
            }
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('CLS observation failed:', error);
    }
  }

  private observeFCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordWebVital({
              name: 'FCP',
              value: entry.startTime,
              delta: entry.startTime,
              id: this.generateId(),
              navigationType: this.getNavigationType(),
            });
          }
        }
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.warn('FCP observation failed:', error);
    }
  }

  private observeTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.recordWebVital({
          name: 'TTFB',
          value: ttfb,
          delta: ttfb,
          id: this.generateId(),
          navigationType: this.getNavigationType(),
        });
      }
    } catch (error) {
      console.warn('TTFB observation failed:', error);
    }
  }

  private initCustomMetrics() {
    // Monitor React component render times
    this.monitorReactRenders();
    
    // Monitor database query times
    this.monitorDatabaseQueries();
    
    // Monitor bundle loading times
    this.monitorBundleLoading();
  }

  private monitorReactRenders() {
    // This would integrate with React DevTools Profiler
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      // Implementation would hook into React's profiler
      console.log('React render monitoring enabled');
    }
  }

  private monitorDatabaseQueries() {
    // Monitor Supabase query performance
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const response = await originalFetch(...args);
      const duration = performance.now() - start;
      
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      if (url.includes('supabase') || url.includes('/api/')) {
        this.recordMetric({
          name: 'database-query',
          value: duration,
          timestamp: Date.now(),
          url: url,
          userAgent: navigator.userAgent,
        });
      }
      
      return response;
    };
  }

  private monitorBundleLoading() {
    // Monitor script loading times
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach((script) => {
      const start = performance.now();
      script.addEventListener('load', () => {
        const duration = performance.now() - start;
        this.recordMetric({
          name: 'bundle-load',
          value: duration,
          timestamp: Date.now(),
          url: (script as HTMLScriptElement).src,
          userAgent: navigator.userAgent,
        });
      });
    });
  }

  private recordMetric(metric: PerformanceMetric) {
    if (!this.isEnabled) return;
    
    this.metrics.push(metric);
    
    // Send metrics if batch is full
    if (this.metrics.length >= this.batchSize) {
      this.sendMetrics();
    }
  }

  private recordWebVital(vital: WebVital) {
    this.recordMetric({
      name: `web-vital-${vital.name.toLowerCase()}`,
      value: vital.value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${vital.name}: ${vital.value.toFixed(2)}ms`);
    }
  }

  private startMetricsSender() {
    setInterval(() => {
      if (this.metrics.length > 0) {
        this.sendMetrics();
      }
    }, this.sendInterval);
  }

  private async sendMetrics(force = false) {
    if (!this.isEnabled || this.metrics.length === 0) return;
    
    const now = Date.now();
    if (!force && now - this.lastSent < this.sendInterval) return;
    
    const metricsToSend = [...this.metrics];
    this.metrics = [];
    this.lastSent = now;
    
    try {
      // In a real implementation, you'd send to your analytics service
      // For now, we'll just log them
      if (process.env.NODE_ENV === 'development') {
        console.group('Performance Metrics');
        console.table(metricsToSend);
        console.groupEnd();
      }
      
      // Example: Send to analytics service
      // await fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metricsToSend),
      // });
      
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      // Re-add metrics for retry
      this.metrics.unshift(...metricsToSend);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getNavigationType(): string {
    if ('navigation' in performance) {
      const nav = performance.navigation;
      switch (nav.type) {
        case 0: return 'navigate';
        case 1: return 'reload';
        case 2: return 'back_forward';
        default: return 'unknown';
      }
    }
    return 'unknown';
  }

  // Public methods
  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public clearMetrics() {
    this.metrics = [];
  }

  public trackCustomEvent(name: string, value: number) {
    this.recordMetric({
      name: `custom-${name}`,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    trackEvent: performanceMonitor.trackCustomEvent.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    enable: performanceMonitor.enable.bind(performanceMonitor),
    disable: performanceMonitor.disable.bind(performanceMonitor),
  };
}
