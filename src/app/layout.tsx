// src/app/layout.tsx
"use client";

import { Inter } from 'next/font/google';
// import type { Metadata } from 'next'; // Metadata cannot be exported from Client Components
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout'; 
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '../context/auth-context'; // Changed to relative path
import ClientOnly from '@/components/client-only'; 
// import { SidebarProvider } from '@/components/ui/sidebar'; // Removed: SidebarProvider is not exported
import { ThemeWatcher } from '@/context/theme-watcher';
import { cn } from '@/lib/utils';


const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata needs to be defined in a server component or removed if this stays client component.
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
        <Providers>
          <AuthProvider> {/* AuthProvider now wraps SidebarProvider and AppLayout */}
            {/* <SidebarProvider> Removed SidebarProvider wrapper */}
              <ThemeWatcher>
                <ClientOnly>
                  <AppLayout>
                    {children}
                  </AppLayout>
                </ClientOnly>
                <Toaster />
              </ThemeWatcher>
            {/* </SidebarProvider> Removed SidebarProvider wrapper */}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

