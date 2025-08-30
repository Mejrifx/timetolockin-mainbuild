import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Workspace } from '@/Workspace';
import { AuthPage } from '@/components/AuthPage';
import { PerformanceOptimizer } from '@/components/PerformanceOptimizer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './App.css';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading GM AI...</p>
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