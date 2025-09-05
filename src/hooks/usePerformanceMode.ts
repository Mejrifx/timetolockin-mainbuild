import { useState, useEffect } from 'react';

/**
 * Hook to detect performance issues and automatically optimize animations
 */
export function usePerformanceMode() {
  const [isHighPerformanceMode, setIsHighPerformanceMode] = useState(false);
  const [frameRate, setFrameRate] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    // Monitor frame rate to detect performance issues
    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFrameRate(fps);
        
        // Enable high performance mode if FPS drops below 45
        setIsHighPerformanceMode(fps < 45);
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(measureFrameRate);
    };

    // Start monitoring
    animationFrameId = requestAnimationFrame(measureFrameRate);

    // Also check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighPerformanceMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Initial check
    if (mediaQuery.matches) {
      setIsHighPerformanceMode(true);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Apply performance optimizations to document
  useEffect(() => {
    if (isHighPerformanceMode) {
      document.documentElement.classList.add('performance-mode');
      
      // Add performance CSS
      const style = document.createElement('style');
      style.id = 'performance-mode-styles';
      style.textContent = `
        .performance-mode * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
        
        .performance-mode .backdrop-blur-xl {
          backdrop-filter: blur(4px) !important;
        }
        
        .performance-mode .shadow-xl,
        .performance-mode .shadow-lg {
          box-shadow: none !important;
        }
        
        .performance-mode .hover\\:scale-105:hover,
        .performance-mode .hover\\:scale-110:hover {
          transform: none !important;
        }
      `;
      
      if (!document.getElementById('performance-mode-styles')) {
        document.head.appendChild(style);
      }
    } else {
      document.documentElement.classList.remove('performance-mode');
      const existingStyle = document.getElementById('performance-mode-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }, [isHighPerformanceMode]);

  return {
    isHighPerformanceMode,
    frameRate,
    shouldReduceAnimations: isHighPerformanceMode || frameRate < 50
  };
}

/**
 * Hook to throttle expensive operations during low performance
 */
export function usePerformanceThrottle<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 16
): T {
  const { shouldReduceAnimations } = usePerformanceMode();
  
  return ((...args: Parameters<T>) => {
    if (shouldReduceAnimations) {
      // Skip or throttle the operation during low performance
      const throttledDelay = delay * 2; // Double the delay during low performance
      setTimeout(() => func(...args), throttledDelay);
    } else {
      func(...args);
    }
  }) as T;
}
