import { AuthProvider, useAuth } from '@/lib/AuthContextSync';
import { Workspace } from '@/Workspace';
import { AuthPage } from '@/components/AuthPage';
import { PerformanceOptimizer } from '@/components/PerformanceOptimizer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { monitorPerformance } from '@/utils/performanceUtils';
import { useEffect } from 'react';
import './App.css';

const AppContent = () => {
  const { user, loading } = useAuth();

  // Initialize performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      monitorPerformance();
    }
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="loading-spinner" />
          <p className="text-white text-lg text-performance">Loading GM AI...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PerformanceOptimizer />
      {user ? <Workspace /> : <AuthPage />}
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;