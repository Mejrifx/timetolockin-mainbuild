import { lazy, Suspense, ComponentType } from 'react';

// Lazy load dashboard components
const DailyTasksDashboardLazy = lazy(() => 
  import('./DailyTasksDashboard').then(module => ({ default: module.DailyTasksDashboard }))
);

const CalendarDashboardLazy = lazy(() => 
  import('./CalendarDashboard').then(module => ({ default: module.CalendarDashboard }))
);

const FinanceDashboardLazy = lazy(() => 
  import('./FinanceDashboard').then(module => ({ default: module.FinanceDashboard }))
);

const HealthLabDashboardLazy = lazy(() => 
  import('./HealthLabDashboard').then(module => ({ default: module.HealthLabDashboard }))
);

const EditorLazy = lazy(() => 
  import('./Editor').then(module => ({ default: module.Editor }))
);

// Loading fallback component
const ComponentLoader = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading {name}...</p>
    </div>
  </div>
);

// Higher-order component for lazy loading with suspense
const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  name: string
) => {
  return (props: P) => (
    <Suspense fallback={<ComponentLoader name={name} />}>
      <Component {...props} />
    </Suspense>
  );
};

// Export wrapped components
export const DailyTasksDashboard = withLazyLoading(DailyTasksDashboardLazy, 'Daily Tasks');
export const CalendarDashboard = withLazyLoading(CalendarDashboardLazy, 'Calendar');
export const FinanceDashboard = withLazyLoading(FinanceDashboardLazy, 'Finance');
export const HealthLabDashboard = withLazyLoading(HealthLabDashboardLazy, 'Health Lab');
export const Editor = withLazyLoading(EditorLazy, 'Editor');
