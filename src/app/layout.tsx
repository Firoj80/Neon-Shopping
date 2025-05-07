import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Import Inter font
import { cn } from '@/lib/utils';
import './globals.css';
import { Providers } from './providers'; // Import Providers
import { AppLayout } from '@/components/layout/app-layout';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider
import { Toaster } from "@/components/ui/toaster";
import ClientOnly from '@/components/client-only'; // Import ClientOnly

// Use Inter font
const inter = Inter({
  variable: '--font-inter', // Set a CSS variable
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
        {/* Apply the font variable */}
        <body
            className={cn(
            inter.variable, // Apply the Inter font variable
            'font-sans antialiased min-h-screen flex flex-col bg-background', // Use font-sans
            )}
        >
          <Providers>
              <SidebarProvider>
                <ClientOnly> {/* Wrap AppLayout with ClientOnly */}
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
