import type { Metadata, Viewport } from 'next';
import Sidebar from './components/Sidebar';
import PWARegistration from './components/PWARegistration';
import NotificationToast from './components/NotificationToast';
import OfflineIndicator from './components/OfflineIndicator';
import { SettingsProvider } from './contexts/SettingsContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { QueryProvider } from './providers/QueryProvider';
import MobileNav from './components/layout/MobileNav';
import MobileHeader from './components/MobileHeader';
import PinLockWrapper from './components/PinLockWrapper';
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
    <html lang="id" suppressHydrationWarning className="h-full overflow-hidden">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <style>{`
          html, body {
            height: 100%;
            height: 100dvh;
            overflow: hidden;
            overscroll-behavior: none;
          }
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
      <body className="font-sans bg-[#09090b] text-zinc-100 antialiased h-full overflow-hidden">
        <ErrorBoundary>
          <QueryProvider>
            <PWARegistration />
            <NotificationToast enabled={true} />
            <OfflineIndicator position="top" showPendingCount={true} />
            <SettingsProvider>
              <PinLockWrapper />
              {/* App Container - Full viewport height */}
              <div className="flex h-[100dvh] h-[100vh] w-full overflow-hidden">
                  {/* Desktop Sidebar */}
                  <div className="hidden lg:flex lg:shrink-0 h-full">
                    <Sidebar />
                  </div>

                  {/* Main Content Area */}
                  <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    {/* Mobile Header */}
                    <div className="lg:hidden shrink-0 h-14">
                      <MobileHeader />
                    </div>

                    {/* Content - Takes remaining space */}
                    <div className="flex-1 min-h-0 w-full max-w-[1400px] mx-auto px-2 sm:px-3 md:px-4 py-2 overflow-hidden">
                      {children}
                    </div>
                  </main>

                  {/* Mobile Bottom Navigation */}
                  <div className="lg:hidden shrink-0 h-16">
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
