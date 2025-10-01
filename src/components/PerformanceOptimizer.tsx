import { useEffect } from 'react';

export const PerformanceOptimizer = () => {
  useEffect(() => {
    // Optimize text input performance
    const optimizeTextInputs = () => {
      const inputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable]');
      inputs.forEach((input) => {
        // Add performance optimizations to text inputs
        (input as HTMLElement).style.willChange = 'contents';
        (input as HTMLElement).style.contain = 'layout style';
        
        // Debounce input events to reduce lag
        let timeoutId: NodeJS.Timeout;
        const originalHandler = (input as any)._performanceHandler;
        
        if (!originalHandler) {
          const debouncedHandler = (e: Event) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              // Trigger any existing handlers
              const event = new Event(e.type, { bubbles: true });
              e.target?.dispatchEvent(event);
            }, 16); // ~60fps
          };
          
          (input as any)._performanceHandler = debouncedHandler;
          input.addEventListener('input', debouncedHandler, { passive: true });
        }
      });
    };

    // Optimize scroll performance
    const optimizeScrolling = () => {
      const scrollableElements = document.querySelectorAll('[data-scroll-optimized]');
      scrollableElements.forEach((element) => {
        (element as HTMLElement).style.scrollBehavior = 'smooth';
        (element as any).style.webkitOverflowScrolling = 'touch';
        (element as HTMLElement).style.contain = 'layout style paint';
      });
    };

    // Optimize animations
    const optimizeAnimations = () => {
      // Reduce motion for users who prefer it
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        `;
        document.head.appendChild(style);
      }
    };

    // Optimize images
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        // Add loading optimization
        if (!img.loading) {
          img.loading = 'lazy';
        }
        
        // Add decode optimization
        img.decoding = 'async';
        
        // Add performance hints
        img.style.contain = 'layout style paint';
      });
    };

    // Run optimizations
    optimizeTextInputs();
    optimizeScrolling();
    optimizeAnimations();
    optimizeImages();

    // Re-run optimizations when DOM changes
    const observer = new MutationObserver(() => {
      optimizeTextInputs();
      optimizeScrolling();
      optimizeImages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  // Add critical performance CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Critical performance optimizations */
      .performance-critical {
        contain: layout style paint;
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      .text-performance {
        contain: layout style;
        will-change: contents;
        text-rendering: optimizeSpeed;
      }
      
      .scroll-performance {
        contain: layout style paint;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      .gpu-accelerated {
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      /* Optimize input lag */
      input, textarea, [contenteditable] {
        contain: layout style;
        will-change: contents;
      }
      
      /* Optimize button interactions */
      button, [role="button"] {
        contain: layout style paint;
        will-change: background-color, opacity, transform;
        transform: translateZ(0);
      }
      
      /* Optimize hover states */
      .hover-optimized:hover {
        transform: translateZ(0) scale(1.02);
        transition: transform 0.1s ease-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};