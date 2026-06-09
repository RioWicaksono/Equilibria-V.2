'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

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