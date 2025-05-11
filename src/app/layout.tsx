
"use client";

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; 
import { AppLayout } from '@/components/layout/app-layout'; 
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only'; 
import { cn } from '@/lib/utils';


const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

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
            <ClientOnly>
              <AppLayout>
                {children}
              </AppLayout>
            </ClientOnly>
            <Toaster />
        </Providers>
      </body>
    </html>
  );
}
