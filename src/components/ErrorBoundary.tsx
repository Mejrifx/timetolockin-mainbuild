import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GridBackground } from '@/components/ui/grid-background';

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
    console.error('❌ React Error Boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <GridBackground className="h-screen overflow-hidden">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
                <h2 className="text-red-400 text-xl font-semibold mb-3">Something went wrong</h2>
                <p className="text-red-300 text-sm mb-4">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <div className="text-left bg-black/40 rounded-lg p-4 text-xs">
                  <p className="text-gray-300 mb-2">Error details:</p>
                  <pre className="text-gray-400 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                    {this.state.error?.stack}
                  </pre>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
              >
                Reload Page
              </button>
            </div>
          </div>
        </GridBackground>
      );
    }

    return this.props.children;
  }
} 