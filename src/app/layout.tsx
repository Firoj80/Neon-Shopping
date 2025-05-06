
import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Import Providers
import { AppLayout } from '@/components/layout/app-layout';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only'; // Import ClientOnly

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Neon Shopping', // Updated App Name
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
               <SidebarProvider>
                  <AppLayout>
                      {children}
                  </AppLayout>
               </SidebarProvider>
                {/* AdInitializer removed */}
            <Toaster />
          </Providers>
         </body>
     </html>
  );
}