import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google'; // Using Mono for a more cyberpunk feel
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers';
import { AppLayout } from '@/components/layout/app-layout';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NeonWallet - Cyberpunk Expense Tracker',
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
          'font-mono antialiased min-h-screen flex flex-col',
        )}
      >
        <Providers>
          <AppLayout>
             {children}
          </AppLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
