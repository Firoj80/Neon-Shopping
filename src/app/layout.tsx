"use client"; // This must be a client component for AuthProvider and other client hooks

import { Inter } from 'next/font/google';
// Removed usePathname as it's now handled within AppLayout or context
// import type { Metadata } from 'next'; // Metadata export removed
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider
import ClientOnly from '@/components/client-only'; // Import ClientOnly

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata cannot be exported from a Client Component.
// It should be defined in a Server Component or moved to a dedicated metadata file.
// export const metadata: Metadata = {
//   title: 'Neon Shopping',
//   description: 'Track your expenses and manage shopping lists with a neon cyberpunk aesthetic.',
//   icons: [{ rel: 'icon', url: '/favicon.ico' }],
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          'font-sans antialiased min-h-screen flex flex-col bg-background',
        )}
      >
        <Providers> {/* QueryClientProvider and AppProvider are here */}
           <AuthProvider> {/* Wrap with AuthProvider */}
               {/* AppLayout now handles conditional rendering based on auth */}
                <AppLayout>
                  {children}
                </AppLayout>
              <Toaster />
           </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
