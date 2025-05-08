import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Reverted font import if it changed
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Import Providers
import { AppLayout } from '@/components/layout/app-layout';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider
import { Toaster } from "@/components/ui/toaster";
// Removed AuthProvider import
import ClientOnly from '@/components/client-only'; // Import ClientOnly

const inter = Inter({ // Keep font setup if it was correct in a5b0e2a0
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = { // Keep metadata if it was correct in a5b0e2a0
  title: 'Neon Shopping',
  description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }], // Added favicon link back if needed
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
          inter.variable, // Use the correct font variable
          'font-sans antialiased min-h-screen flex flex-col bg-background', // Use font-sans
        )}
      >
        <Providers> {/* Providers includes AppProvider */}
           <SidebarProvider> {/* Wrap AppLayout with SidebarProvider */}
                <AppLayout>
                  {children}
                </AppLayout>
              <Toaster />
           </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
