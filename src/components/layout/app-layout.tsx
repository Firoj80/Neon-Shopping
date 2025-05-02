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
  ShoppingBag, // Using ShoppingBag now
  Menu,
  X,
  History,
  DollarSign,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const AdComponent = dynamic(() => import('../admob/ad-component'), {
  ssr: false, // Ensure this component is only loaded on the client-side
});

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
  const { setOpenMobile } = useSidebar(); // Get setOpenMobile to close sidebar on mobile
  const router = useRouter(); // Use router for navigation after ad

  const mainMenuItems = [
    { href: '/list', label: 'Shopping List', icon: LayoutGrid },
    { href: '/stats', label: 'Dashboard', icon: BarChart3, showAd: false }, // Mark for interstitial ad
    { href: '/history', label: 'History', icon: History, showAd: false }, // Mark for interstitial ad
    { href: '/currency', label: 'Currency', icon: DollarSign, showAd: false }, // Mark for interstitial ad
  ];

  const helpMenuItems = [
    { href: '/about', label: 'About Us', icon: HelpCircle },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: LayoutGrid },
  ];

   // Function to handle link clicks and potentially show ads
   const handleLinkClick = async (item: { href: string, showAd?: boolean }, event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
       // Close mobile sidebar if open
       setOpenMobile(false);
       router.push(item.href);
   };


  return (
    <> {/* Removed SidebarProvider from here - it should wrap AppLayout in layout.tsx */}
      {/* AdMob Banner Placement - Fixed at the bottom */}
       <div className="fixed bottom-0 left-0 right-0 z-40 h-[50px] bg-transparent pointer-events-none">
       <AdComponent/>
        </div>

      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex md:flex-col"> {/* Ensure sidebar uses flex */}
        <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
          <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <ShoppingBag className="w-6 h-6" /> {/* Updated Icon */}
            <span>Neon Shopping List</span> {/* Ensure this name is consistent */}
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex-grow flex flex-col overflow-y-auto"> {/* Allow content to grow and scroll */}
          <SidebarMenu className="flex-grow">
            {mainMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  {/* Wrap Link in the button and attach onClick handler */}
                  <Link href={item.href} onClick={(e) => handleLinkClick(item, e)}>
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
                    >
                       {/* Wrap Link in the button and attach onClick handler */}
                       <Link href={item.href} onClick={(e) => handleLinkClick(item, e)}>
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

        {/* Content - Add padding bottom to avoid overlap with fixed banner */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-[60px]"> {/* Adjust padding-bottom */}
          {children}
        </main>

      </SidebarInset>
      </>
  );
}
