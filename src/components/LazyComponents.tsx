import { lazy, Suspense, ComponentType } from 'react';
import { cn } from '@/lib/utils';

// Lazy load dashboard components
export const LazyDailyTasksDashboard = lazy(() => 
  import('./DailyTasksDashboard').then(module => ({ 
    default: module.DailyTasksDashboard 
  }))
);

export const LazyCalendarDashboard = lazy(() => 
  import('./CalendarDashboard').then(module => ({ 
    default: module.CalendarDashboard 
  }))
);

export const LazyFinanceDashboard = lazy(() => 
  import('./FinanceDashboard').then(module => ({ 
    default: module.FinanceDashboard 
  }))
);

export const LazyHealthLabDashboard = lazy(() => 
  import('./HealthLabDashboard').then(module => ({ 
    default: module.HealthLabDashboard 
  }))
);

export const LazyEditor = lazy(() => 
  import('./Editor').then(module => ({ 
    default: module.Editor 
  }))
);

export const LazyBlockEditor = lazy(() => 
  import('./BlockEditor').then(module => ({ 
    default: module.BlockEditor 
  }))
);

// Loading component with skeleton
const LoadingFallback = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="space-y-4 p-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  </div>
);

// HOC for wrapping lazy components with suspense
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallbackClassName?: string
) {
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={<LoadingFallback className={fallbackClassName} />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-wrapped components ready to use
export const DailyTasksDashboard = withLazyLoading(LazyDailyTasksDashboard, "h-full");
export const CalendarDashboard = withLazyLoading(LazyCalendarDashboard, "h-full");
export const FinanceDashboard = withLazyLoading(LazyFinanceDashboard, "h-full");
export const HealthLabDashboard = withLazyLoading(LazyHealthLabDashboard, "h-full");
export const Editor = withLazyLoading(LazyEditor, "h-full");
export const BlockEditor = withLazyLoading(LazyBlockEditor, "h-full");
