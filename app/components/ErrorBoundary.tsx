'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', {
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
              Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
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