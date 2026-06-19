'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface PageErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Page-level error boundary for React components
 * Use this to wrap page content and prevent full page crashes
 */
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, State> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PageErrorBoundary] Caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorId: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Maaf, terjadi kesalahan pada halaman ini. Silakan coba muat ulang.
            </p>

            {this.state.errorId && (
              <div className="bg-black/40 rounded-lg p-3 mb-6">
                <p className="text-[10px] text-zinc-500 font-mono">
                  Error ID: {this.state.errorId}
                </p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-black/40 rounded-lg p-3 mb-6">
                <summary className="text-xs text-zinc-400 cursor-pointer hover:text-white">
                  Detail Error (Development Only)
                </summary>
                <pre className="mt-2 text-[10px] text-rose-400 font-mono overflow-auto max-h-32">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang
              </button>
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] text-white font-medium rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Section-level error boundary for individual components
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, State> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorId: `err_${Date.now()}` };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 ${this.props.className || ''}`}>
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Gagal memuat komponen</p>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorId: null })}
                className="text-xs underline hover:no-underline"
              >
                Coba lagi
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async data fetch error handler
 */
interface AsyncErrorState {
  error: string | null;
  isRetrying: boolean;
}

export function useAsyncError() {
  const [state, setState] = React.useState<AsyncErrorState>({
    error: null,
    isRetrying: false,
  });

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
    setState({ error: message, isRetrying: false });
  };

  const retry = () => {
    setState({ error: null, isRetrying: true });
  };

  const clearError = () => {
    setState({ error: null, isRetrying: false });
  };

  return { ...state, handleError, retry, clearError };
}

import React from 'react';
