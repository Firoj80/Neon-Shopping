
import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google'; // Using Mono for a more cyberpunk feel
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers';
import { AppLayout } from '@/components/layout/app-layout';
// Removed ClientOnly import as AdComponent handles client-side loading
import { SidebarProvider } from '@/components/ui/sidebar';


const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Neon Shopping List - Cyberpunk Expense Tracker', // Updated App Name
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
          geistMono.variable,
          'font-mono antialiased min-h-screen flex flex-col bg-background', // Ensure background covers full height
        )}
      >
        <Providers>
           {/* AdInitializer is rendered via AdComponent which is dynamically imported client-side */}
            <SidebarProvider>
             <AppLayout>
             {children}
            </AppLayout>
            </SidebarProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
