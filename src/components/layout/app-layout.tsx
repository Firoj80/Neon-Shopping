"use client";

import React from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  BarChart3,
  Settings,
  HelpCircle,
  Mail,
  ShieldCheck,
  FileText,
  Star,
  Boxes,
  Wallet,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/list', label: 'Shopping List', icon: LayoutGrid },
    { href: '/stats', label: 'Dashboard', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const helpMenuItems = [
    { href: '/about', label: 'About Us', icon: HelpCircle },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: Boxes },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-border/30">
          <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Wallet className="w-6 h-6" />
            <span>NeonWallet</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          {/* Separator or different group for help items */}
           <div className="mt-auto p-2">
             <SidebarMenu>
            {helpMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    variant="ghost" // Use ghost for less emphasis
                    size="sm"
                    >
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                ))}
            </SidebarMenu>
           </div>
        </SidebarContent>
         <SidebarFooter className="p-2 border-t border-border/30 mt-auto">
          {/* Footer content if needed, e.g., version number */}
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary md:hidden">
                <Wallet className="w-6 h-6" />
                <span className="sr-only">NeonWallet</span>
            </Link>
          <SidebarTrigger className="ml-auto" />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        {/* Placeholder for Bottom Banner Ad */}
        <footer className="sticky bottom-0 h-16 bg-card border-t border-border/30 flex items-center justify-center text-muted-foreground text-sm">
            AdMob Banner Placeholder
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
