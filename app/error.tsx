'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        extra: {
          digest: error.digest,
        },
      });
    }

    // Always log to console
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-[#0A0A0A] text-[#E5E5E5] min-h-screen flex items-center justify-center p-4">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
          </p>

          {error.digest && (
            <div className="bg-black/40 rounded-lg p-3 mb-6">
              <p className="text-[10px] text-zinc-500 font-mono">
                Error ID: {error.digest}
              </p>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="text-left bg-black/40 rounded-lg p-3 mb-6">
              <summary className="text-xs text-zinc-400 cursor-pointer hover:text-white">
                Detail Error (Development Only)
              </summary>
              <pre className="mt-2 text-[10px] text-rose-400 font-mono overflow-auto max-h-32">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}