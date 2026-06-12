'use client';

/**
 * Production Error Boundary
 * Catches errors and reports them to tracking service
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Bug, ExternalLink } from 'lucide-react';
import { captureClientError } from '@/lib/errorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorId: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Capture error
    const errorId = captureClientError(error);

    this.setState({ errorId });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null, errorId: null });
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isProduction = process.env.NODE_ENV === 'production';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A]">
          <div className="max-w-md w-full bg-[#141414] border border-[#262626] rounded-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Terjadi Kesalahan
            </h2>

            <p className="text-sm text-zinc-400 mb-6">
              Maaf, terjadi kesalahan yang tidak terduga.
            </p>

            {/* Error ID for debugging */}
            {this.state.errorId && (
              <div className="mb-4 p-3 bg-black/40 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Error ID</p>
                <code className="text-xs text-rose-400 font-mono">
                  {this.state.errorId}
                </code>
              </div>
            )}

            {/* Error details in development */}
            {!isProduction && this.state.error && (
              <div className="mb-4 p-4 bg-black/40 rounded-lg text-left">
                <p className="text-xs text-rose-400 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-[10px] text-zinc-600 font-mono overflow-x-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang
              </button>
            </div>

            {/* Report bug link */}
            <a
              href={`https://github.com/issues/new?title=Error: ${this.state.error?.message}&body=Error ID: ${this.state.errorId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-teal-400 transition-colors"
            >
              <Bug className="w-3 h-3" />
              Laporkan Bug
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductionErrorBoundary;