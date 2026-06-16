'use client';

import dynamic from 'next/dynamic';

// Lazy load swagger-ui-react (~500KB heavy package)
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-zinc-400">Loading API Documentation...</p>
      </div>
    </div>
  ),
});

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">API Documentation</h1>
          <p className="text-zinc-400">Dokumentasi API untuk aplikasi Equilibria Finance</p>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 md:p-6">
          <SwaggerUI
            url="/api/docs-json"
            persistAuthorization
            displayRequestDuration
            docExpansion="list"
            filter
          />
        </div>
      </div>
    </div>
  );
}