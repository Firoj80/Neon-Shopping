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
  useSidebar,
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
  ShoppingBasket, // Use ShoppingBasket for app icon
  Menu,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Consistent App Name
const APP_NAME = "Neon Shopping List"; // Ensure this is the correct name

// New Mobile Header component that uses the hook
const MobileHeader = () => {
  const { isMobile, openMobile, toggleSidebar } = useSidebar(); // Hook is used here, inside the provider context

  if (!isMobile) return null; // Only render on mobile

  return (
     // Use sticky to keep it at the top while scrolling down page content
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
       {/* Hamburger Menu Trigger on the left */}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2"> {/* Added margin-right */}
         <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={openMobile ? "x" : "menu"}
            initial={{ rotate: openMobile ? 90 : -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: openMobile ? -90 : 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.div>
        </AnimatePresence>
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

       {/* App Name/Logo */}
      <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
        <ShoppingBasket className="w-6 h-6" />
        <span className="font-bold">{APP_NAME}</span>
      </Link>

      {/* Placeholder for potential right-side actions */}
      <div className="w-8"></div> {/* Maintain balance */}
    </header>
  );
};


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
    // SidebarProvider wraps everything that needs the sidebar context
    <SidebarProvider>
       {/* Desktop Sidebar - Hidden on small screens */}
       <Sidebar className="hidden md:block">
        <SidebarHeader className="p-4 border-b border-border/30">
          <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <ShoppingBasket className="w-6 h-6" />
            <span>{APP_NAME}</span> {/* Use constant */}
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
       {/* Added overflow-x-hidden to prevent horizontal scroll */}
      <SidebarInset className="flex flex-col min-h-screen overflow-x-hidden">
         {/* Mobile Header is now rendered inside the provider context */}
         <MobileHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
             {children}
        </main>

        {/* Ad Banner Placeholder */}
        <footer className="h-16 bg-card border-t border-border/30 flex items-center justify-center text-muted-foreground text-sm mt-auto shrink-0">
            AdMob Banner Placeholder
        </footer>
      </SidebarInset>
    </SidebarProvider> // Provider ends here
  );
}

