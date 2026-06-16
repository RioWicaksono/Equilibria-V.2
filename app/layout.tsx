import type { Metadata, Viewport } from 'next';
import Sidebar from './components/Sidebar';
import PWARegistration from './components/PWARegistration';
import { SettingsProvider } from './contexts/SettingsContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { QueryProvider } from './providers/QueryProvider';
import MobileNav from './components/layout/MobileNav';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
};

export const metadata: Metadata = {
  title: 'Equilibria - Aplikasi Keuangan Pribadi',
  description: 'Aplikasi pencatatan keuangan pribadi dengan fitur lengkap untuk mengelola transaksi, tabungan, budget, dan target finansial.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Equilibria',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <style>{`
          :root {
            --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          body {
            font-family: var(--font-sans);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}</style>
      </head>
      <body className="font-sans bg-[#0A0A0A] text-[#E5E5E5] antialiased">
        <ErrorBoundary>
          <QueryProvider>
            <PWARegistration />
            <SettingsProvider>
              <div className="flex min-h-screen">
                  {/* Desktop Sidebar - Hidden on mobile and tablet (< 1024px) */}
                  <div className="hidden lg:block">
                    <Sidebar />
                  </div>

                  {/* Main Content Area */}
                  <main className="flex-1 w-full min-w-0 pt-14 lg:pt-0 pb-20 lg:pb-6">
                    {/* Mobile/Tablet Header - Hidden on lg+ */}
                    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0A0A0A]/98 backdrop-blur-xl border-b border-[#262626] h-14">
                      <div className="flex items-center justify-between h-full px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded-lg text-sm">
                            E
                          </span>
                          <span className="text-base font-bold text-white">Equilibria</span>
                        </div>
                      </div>
                    </header>

                    {/* Content Container */}
                    <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
                      {children}
                    </div>
                  </main>

                  {/* Mobile/Tablet Bottom Navigation - Hidden on lg+ */}
                  <div className="lg:hidden">
                    <MobileNav />
                  </div>
                </div>
            </SettingsProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
