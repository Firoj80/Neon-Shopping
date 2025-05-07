import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a fallback
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers';
import { AppLayout } from '@/components/layout/app-layout';
import { SidebarProvider } from '@/components/ui/sidebar';
// import { ThemeWatcher } from '@/context/theme-watcher'; // ThemeWatcher removed
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only';

const inter = Inter({ // Replaced GeistMono with Inter as a fallback
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Neon Shopping',
  description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable, // Use Inter variable
          'font-sans antialiased min-h-screen flex flex-col bg-background', // Changed font-mono to font-sans
        )}
      >
        <Providers>
          {/* ThemeWatcher removed */}
          <SidebarProvider>
            <ClientOnly>
              <AppLayout>
                {children}
              </AppLayout>
            </ClientOnly>
            <Toaster />
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
