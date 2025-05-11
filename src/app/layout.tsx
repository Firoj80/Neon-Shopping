// src/app/layout.tsx
"use client";

import { Inter } from 'next/font/google';
// import type { Metadata } from 'next'; // Metadata moved or handled differently with "use client"
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Info,
  Mail,
  ShieldCheck as PolicyIcon,
  FileText as ArticleIcon,
  Star,
  AppWindow as AppsIcon,
  Palette, 
} from 'lucide-react';
import './globals.css';
import { Providers } from './providers'; // Providers includes AppProvider
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
// AuthProvider removed
import ClientOnly from '@/components/client-only'; 
// Removed SidebarProvider as it's handled within AppLayout or not used directly
// import { ThemeWatcher } from '@/context/theme-watcher'; // Removed ThemeWatcher import
import { cn } from '@/lib/utils';
import { AdInitializer } from '@/components/admob/ad-initializer'; // Import AdInitializer

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Metadata is typically not exported from a "use client" component.
// It should be defined in a server component or a separate metadata.ts file.
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
      <head>
         <title>Neon Shopping</title>
         <meta name="description" content="Track your expenses and manage shopping lists with a neon cyberpunk aesthetic." />
         <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={cn(
          inter.variable,
          'font-sans antialiased min-h-screen flex flex-col bg-background',
        )}
      >
        <Providers> {/* AppProvider is already inside Providers */}
            {/* <ThemeWatcher> */} {/* Removed ThemeWatcher wrapper */}
                <ClientOnly> {/* Ensures AppLayout and its children only render client-side */}
                   <AppLayout>
                     <div className="flex-grow pb-[50px]"> {/* Added padding for fixed banner */}
                        {children}
                     </div>
                   </AppLayout>
                   <AdInitializer /> {/* Initialize AdMob */}
                </ClientOnly>
            {/* </ThemeWatcher> */}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

