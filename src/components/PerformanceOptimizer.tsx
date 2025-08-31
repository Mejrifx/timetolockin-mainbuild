import { useEffect } from 'react';

// Component that applies critical performance optimizations
export const PerformanceOptimizer = () => {
  useEffect(() => {
    // Critical performance optimizations
    const applyOptimizations = () => {
      // Enable hardware acceleration for the document
      document.documentElement.style.willChange = 'scroll-position';
      
      // Optimize font rendering
      document.documentElement.style.textRendering = 'optimizeSpeed';
      
      // Enable smooth scrolling
      document.documentElement.style.scrollBehavior = 'smooth';
      
      // Optimize CSS containment
      const style = document.createElement('style');
      style.textContent = `
        /* Critical performance CSS injected via JS */
        * {
          box-sizing: border-box;
        }
        
        /* Optimize repainting */
        html {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeSpeed;
        }
        
        /* Reduce layout thrashing */
        img, video {
          max-width: 100%;
          height: auto;
          contain: layout style;
        }
        
        /* Optimize animations */
        @media (prefers-reduced-motion: no-preference) {
          * {
            scroll-behavior: smooth;
          }
        }
        
        /* Critical layer optimization */
        .will-change-transform {
          will-change: transform;
          transform: translateZ(0);
        }
        
        .will-change-opacity {
          will-change: opacity;
        }
        
        .will-change-contents {
          will-change: contents;
        }
        
        /* Prevent unnecessary repaints */
        .gpu-accelerated {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `;
      document.head.appendChild(style);
      
      // Note: Performance CSS is now included in index.css, no preload needed
    };

    // Apply optimizations on mount
    applyOptimizations();

    // Optimize scroll performance
    const optimizeScroll = () => {
      let ticking = false;
      
      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            ticking = false;
          });
          ticking = true;
        }
      };
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    };

    const cleanupScroll = optimizeScroll();

    // Cleanup
    return () => {
      cleanupScroll();
    };
  }, []);

  return null; // This component doesn't render anything
};

// Hook for component-level performance optimizations
export const usePerformanceOptimization = () => {
  useEffect(() => {
    // Batch DOM updates
    const batchUpdates = (callback: () => void) => {
      requestAnimationFrame(callback);
    };

    // Optimize image loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
      
      return () => imageObserver.disconnect();
    };

    const cleanupImages = optimizeImages();

    return () => {
      cleanupImages();
    };
  }, []);
};
