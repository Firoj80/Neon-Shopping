
"use client";

import React from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  BarChart3,
  HelpCircle,
  Mail,
  ShieldCheck,
  FileText,
  Star,
  Boxes,
  ShoppingBag,
  Menu,
  X,
  History,
  DollarSign,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
// import { useAdMob } from '@/hooks/useAdmob'; // Removed AdMob hook

const APP_NAME = "Neon Shopping List";

// Mobile Header component
const MobileHeader = () => {
  const { isMobile, openMobile, toggleSidebar } = useSidebar();

  if (!isMobile) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Hamburger Menu Trigger on the left */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
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
        <ShoppingBag className="w-6 h-6" /> {/* Updated Icon */}
        <span className="font-bold">{APP_NAME}</span>
      </Link>

      {/* Placeholder to balance header */}
      <div className="w-8"></div> {/* Adjust width if needed */}
    </header>
  );
};


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // const { showInterstitialAd } = useAdMob(); // Removed AdMob hook

  const mainMenuItems = [
    { href: '/list', label: 'Shopping List', icon: LayoutGrid },
    { href: '/stats', label: 'Dashboard', icon: BarChart3 },
    { href: '/history', label: 'History', icon: History },
    { href: '/currency', label: 'Currency', icon: DollarSign },
  ];

  const helpMenuItems = [
    { href: '/about', label: 'About Us', icon: HelpCircle },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: Boxes },
  ];

  const handleLinkClick = (href: string) => {
    // Removed interstitial ad calls
    // const adRoutes = ['/stats', '/history', '/currency'];
    // if (adRoutes.includes(href)) {
    //   showInterstitialAd();
    // }
  };

  return (
    <SidebarProvider>
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex md:flex-col"> {/* Ensure sidebar uses flex */}
        <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
          <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <ShoppingBag className="w-6 h-6" /> {/* Updated Icon */}
            <span>{APP_NAME}</span> {/* Ensure this name is consistent */}
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex-grow flex flex-col"> {/* Allow content to grow */}
          <SidebarMenu className="flex-grow">
            {mainMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  onClick={() => handleLinkClick(item.href)}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
           {/* Help Menu Items */}
           <div className="p-2 shrink-0 border-t border-sidebar-border mt-auto"> {/* Use mt-auto for footer */}
             <SidebarMenu>
                {helpMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLinkClick(item.href)} // Removed ad logic here too
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

        <SidebarFooter className="p-2 border-t border-sidebar-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset className="flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Header */}
        <MobileHeader />

        {/* Content */}
        {/* Removed padding-bottom related to fixed footer */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>

        {/* Ad Banner Placeholder - Removed */}
        {/*
        <footer className="fixed bottom-0 left-0 right-0 z-20 h-16 bg-card border-t border-border/30 flex items-center justify-center text-muted-foreground text-sm md:ml-[var(--sidebar-width)] peer-data-[state=collapsed]:md:ml-[var(--sidebar-width-icon)] peer-data-[collapsible=offcanvas]:md:ml-0 peer-data-[variant=inset]:md:left-[calc(theme(spacing.2))] peer-data-[variant=inset]:md:right-[calc(theme(spacing.2))] peer-data-[variant=inset]:md:bottom-[calc(theme(spacing.2))] peer-data-[variant=inset]:md:rounded-b-xl transition-[margin-left,left,right,bottom] duration-200 ease-linear">
           AdMob Banner Placeholder
         </footer>
        */}

      </SidebarInset>
    </SidebarProvider>
  );
}
