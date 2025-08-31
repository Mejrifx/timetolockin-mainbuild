import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Application Error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    // Log environment state for debugging
    console.log('🔍 Environment Debug Info:');
    console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    console.log('- MODE:', import.meta.env.MODE);
    console.log('- DEV:', import.meta.env.DEV);
    console.log('- PROD:', import.meta.env.PROD);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
              <h1 className="text-3xl font-bold text-red-400 mb-4">
                🚨 Application Error
              </h1>
              
              <div className="text-left bg-black/40 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Error Details:</h3>
                <p className="text-red-300 font-mono text-sm break-all">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              <div className="text-left bg-black/40 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Environment Check:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={import.meta.env.VITE_SUPABASE_URL ? "text-green-400" : "text-red-400"}>
                      {import.meta.env.VITE_SUPABASE_URL ? "✅" : "❌"}
                    </span>
                    <span className="text-gray-300">VITE_SUPABASE_URL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? "text-green-400" : "text-red-400"}>
                      {import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅" : "❌"}
                    </span>
                    <span className="text-gray-300">VITE_SUPABASE_ANON_KEY</span>
                  </div>
                </div>
              </div>

              {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
                <div className="text-left bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">🔧 Fix Instructions:</h3>
                  <ol className="text-sm text-gray-300 space-y-2">
                    <li>1. Go to your Netlify Dashboard</li>
                    <li>2. Select your site → Site Settings → Environment Variables</li>
                    <li>3. Add VITE_SUPABASE_URL with your Supabase project URL</li>
                    <li>4. Add VITE_SUPABASE_ANON_KEY with your Supabase anon key</li>
                    <li>5. Redeploy the site</li>
                  </ol>
                </div>
              )}

              <button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}