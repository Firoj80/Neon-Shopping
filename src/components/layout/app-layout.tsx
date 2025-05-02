
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
  Menu, // Keep using Menu icon for trigger
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

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
       {/* Desktop Sidebar - Hidden on small screens */}
       <Sidebar className="hidden md:block">
        <SidebarHeader className="p-4 border-b border-border/30">
          <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Wallet className="w-6 h-6" />
            <span>NeonWallet</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col"> {/* Use flex-col */}
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

          {/* Help Menu Items - Push to bottom */}
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
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset className="flex flex-col min-h-screen">
         {/* Mobile Header - Only shown on small screens */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Wallet className="w-6 h-6" />
                <span className="font-bold">NeonWallet</span>
            </Link>
            {/* Hamburger Menu Trigger */}
             {/* Pass the Button as the single child to SidebarTrigger when using asChild */}
             <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-5 w-5" /> {/* Icon is inside the button */}
                </Button>
                {/* The sr-only text is implicitly handled by the Button's accessible name/label defined within SidebarTrigger */}
            </SidebarTrigger>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
             {children}
        </main>

        {/* Ad Banner Placeholder */}
        <footer className="h-16 bg-card border-t border-border/30 flex items-center justify-center text-muted-foreground text-sm mt-auto shrink-0">
            AdMob Banner Placeholder
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
