
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  LayoutGrid as Dashboard,
  History,
  Settings,
  Info as InfoIcon,
  Mail,
  ShieldCheck as Policy,
  FileText as Article,
  Star,
  Store as Apps,
  Menu,
  X,
  DollarSign, // Keeping DollarSign for Currency
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar'; // Adjusted path
import { showPreparedInterstitialAd } from '@/components/admob/ad-initializer'; // Correct path
import ClientOnly from '@/components/client-only'; // Import ClientOnly
import { Capacitor } from '@capacitor/core'; // Import Capacitor

// Dynamically import AdInitializer (handles banner display)
import { AdInitializer } from '@/components/admob/ad-initializer';


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
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
         <ShoppingCart className="w-6 h-6" /> {/* Use Cart icon */}
         <span className="font-bold text-neonText">Neon Shopping</span> {/* Updated App Name */}
      </Link>

      {/* Placeholder to balance header */}
      <div className="w-8"></div> {/* Adjust width if needed */}
    </header>
  );
};


// --- App Layout Component ---
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar(); // Get sidebar context
  const router = useRouter();

   // Menu Items & Icons
   const menuItems = [
     { href: '/list', label: 'Shopping List', icon: ShoppingCart, triggerAd: false },
     { href: '/stats', label: 'Dashboard', icon: Dashboard, triggerAd: true }, // Ad on Dashboard
     { href: '/history', label: 'History', icon: History, triggerAd: true },   // Ad on History
     { href: '/settings', label: 'Settings', icon: Settings, triggerAd: true }, // Ad on Settings
     { href: '/about', label: 'About Us', icon: InfoIcon, triggerAd: false },
     { href: '/contact', label: 'Contact Us', icon: Mail, triggerAd: false },
     { href: '/privacy', label: 'Privacy Policy', icon: Policy, triggerAd: false },
     { href: '/terms', label: 'Terms of Service', icon: Article, triggerAd: false },
     { href: '/rate', label: 'Rate App', icon: Star, triggerAd: false },
     { href: '/more-apps', label: 'More Apps', icon: Apps, triggerAd: false },
   ];


  const handleLinkClick = async (item: { href: string; triggerAd: boolean }, event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
     event.preventDefault(); // Prevent default link behavior initially

     // Show interstitial ad only if configured, on native, and plugin is ready
     if (item.triggerAd && Capacitor.isNativePlatform()) {
       try {
         // Attempt to show the ad - the function inside ad-initializer handles readiness checks
         await showPreparedInterstitialAd();
         // Optional small delay after showing ad (might help ensure navigation happens after ad closes)
         await new Promise(resolve => setTimeout(resolve, 100));
       } catch (error) {
         console.error("Error showing interstitial or user closed it:", error);
         // Continue navigation even if the ad fails to show or is closed.
       }
     }

     // Close mobile sidebar if open
    if (isMobile) {
      setOpenMobile(false);
    }
      // Navigate after potential ad display
      router.push(item.href);
  };


   const menuItemClasses = cn(
     "group/menu-item relative flex items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm glow-border-inner", // Added glow-border-inner
     "border border-cyan-500/30 hover:border-white hover:bg-primary/10 shadow-[0_0_5px_theme(colors.cyan.500/0.5)] hover:shadow-[0_0_10px_theme(colors.white/0.7),0_0_4px_theme(colors.white/0.9)]", // Added cyan glow, white hover glow
     "transition-all duration-300 ease-in-out",
     "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:shadow-[0_0_12px_2px_theme(colors.white/0.6),0_0_4px_theme(colors.white/0.8)]",
     "[&_svg]:size-5 [&_svg]:shrink-0",
     "[&_span:last-child]:truncate"
   );


   const activeItemClasses = cn(
     "bg-primary/20 text-primary font-medium border-primary shadow-[0_0_10px_theme(colors.primary/0.8)]", // Active state cyan glow and border
     "hover:text-white hover:border-white hover:shadow-[0_0_15px_3px_theme(colors.white/0.7),0_0_5px_theme(colors.white/0.9)]" // Intensified white glow on hover when active
   );

  return (
    <>
       {/* AdMob Banner Initialization (only runs logic on native) */}
        <ClientOnly>
            <AdInitializer />
        </ClientOnly>


       {/* Desktop Sidebar */}
       <Sidebar className="hidden md:flex md:flex-col">
        <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
           <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
             <ShoppingCart className="w-6 h-6" /> {/* Use Cart icon */}
            <span className="font-bold text-neonText">Neon Shopping</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col"> {/* Use flex-col */}
          {/* Combined Menu Items */}
           <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto"> {/* Added scroll */}
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                   className={cn(
                     menuItemClasses, // Base classes
                     pathname === item.href && activeItemClasses // Active state classes
                   )}
                >
                   <Link href={item.href} onClick={(e) => handleLinkClick(item, e)}>
                     <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                     {/* Use neonText class for the label text */}
                     <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p> {/* You might want to update the version dynamically */}
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Mobile Header */}
        <MobileHeader />

        {/* Content */}
         {/* Adjusted padding-bottom to account for potential fixed AdMob banner */}
         {/* Using env(safe-area-inset-bottom) for better compatibility with notches/home indicators */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-[calc(50px+1.5rem+env(safe-area-inset-bottom))] md:pb-[calc(50px+2rem+env(safe-area-inset-bottom))]"> {/* Increased bottom padding */}
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
    