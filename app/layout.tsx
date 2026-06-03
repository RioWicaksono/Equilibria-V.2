import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from './components/Sidebar';
import PWARegistration from './components/PWARegistration';
import PinProtection from './components/PinProtection';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
};

export const metadata: Metadata = {
  title: 'Equilibria - Financial Tracker',
  description: 'Aplikasi pencatatan keuangan pribadi',
  manifest: '/manifest.json',
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
  const isRailway = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres') && !process.env.DATABASE_URL.includes('${{'));

  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={`${inter.variable} font-sans bg-[#0A0A0A] text-[#E5E5E5] min-h-screen flex flex-col md:flex-row overflow-hidden`}>
        <PWARegistration />
        <PinProtection>
          <Sidebar systemStatus={{ isRailway }} />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col relative w-full h-full">
            <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col">
              {children}
            </div>
          </main>
        </PinProtection>
      </body>
    </html>
  );
}
