import { useState, useRef, useEffect } from 'react';
import { useLazyImage } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  placeholder,
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use intersection observer for lazy loading
  const { ref: containerRef, src: lazySrc, isLoaded } = useLazyImage(
    src,
    placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDEzSDhNMTIgMTNIMTZNMTIgMTNWMTciIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+'
  );

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // Preload critical images
  useEffect(() => {
    if (loading === 'eager' && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
    }
  }, [src, loading]);

  if (imageError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400",
          className
        )}
        style={{ width, height }}
        ref={containerRef}
      >
        <svg 
          className="w-8 h-8" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      ref={containerRef}
      style={{ width, height }}
    >
      {/* Placeholder/Loading state */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={lazySrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        decoding="async"
        // Add performance hints
        fetchPriority={loading === 'eager' ? 'high' : 'low'}
      />
      
      {/* Progressive enhancement blur effect */}
      {!imageLoaded && lazySrc && (
        <img
          src={lazySrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105 opacity-60"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// HOC for converting regular images to optimized images
export const withImageOptimization = (Component: React.ComponentType<any>) => {
  return function OptimizedComponent(props: any) {
    const optimizedProps = { ...props };
    
    // Convert img elements to OptimizedImage
    if (props.src && typeof props.src === 'string') {
      return <OptimizedImage {...optimizedProps} />;
    }
    
    return <Component {...props} />;
  };
};

// Utility for generating responsive image srcsets
export const generateSrcSet = (baseSrc: string, sizes: number[]) => {
  return sizes
    .map(size => {
      // This would integrate with your image optimization service
      const optimizedSrc = baseSrc.replace(/\.(jpg|jpeg|png|webp)$/, `_${size}w.$1`);
      return `${optimizedSrc} ${size}w`;
    })
    .join(', ');
};

// Component for responsive images
interface ResponsiveImageProps extends OptimizedImageProps {
  sizes?: string;
  srcSet?: string;
}

export const ResponsiveImage = ({
  src,
  srcSet,
  sizes = '100vw',
  ...props
}: ResponsiveImageProps) => {
  // Generate srcset if not provided
  const generatedSrcSet = srcSet || generateSrcSet(src, [320, 640, 768, 1024, 1280, 1920]);
  
  return (
    <OptimizedImage
      {...props}
      src={src}
      // Add srcSet and sizes for responsive loading
      {...(generatedSrcSet && { srcSet: generatedSrcSet })}
      {...(sizes && { sizes })}
    />
  );
};
