import type { Metadata, Viewport } from 'next';
import Sidebar from './components/Sidebar';
import PWARegistration from './components/PWARegistration';
import PinProtection from './components/PinProtection';
import { SettingsProvider } from './contexts/SettingsContext';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
};

export const metadata: Metadata = {
  title: 'Equilibria',
  description: 'Aplikasi pencatatan keuangan pribadi',
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
  const isVercel = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres') && !process.env.DATABASE_URL.includes('${{'));

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <style>{`
          :root {
            --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          }
          body {
            font-family: var(--font-sans);
          }
        `}</style>
      </head>
      <body className="font-sans bg-[#0A0A0A] text-[#E5E5E5]">
        <PWARegistration />
        <SettingsProvider>
          <PinProtection>
            <div className="flex min-h-screen">
              <Sidebar systemStatus={{ isVercel }} />

              {/* Main Content Area */}
              <main className="flex-1 overflow-x-hidden pt-12 md:pt-0 pb-20 md:pb-0">
                <div className="w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-5">
                  {children}
                </div>
              </main>
            </div>
          </PinProtection>
        </SettingsProvider>
      </body>
    </html>
  );
}