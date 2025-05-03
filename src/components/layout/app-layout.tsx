"use client";
import React from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  HelpCircle,
  Mail,
  ShieldCheck,
  FileText,
  Star,
  Menu,
  DollarSign,
  X,
  History,
  BarChart3,
  Wallet,
  ShoppingCart,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar, SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar'; // Import Sidebar component

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
         <span className="sr-only">Toggle Sidebar</span>
      </Button>

      {/* App Name/Logo */}
      <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
        <Wallet className="w-6 h-6" /> {/* Use Wallet icon */}
        <span>{APP_NAME}</span> {/* Use APP_NAME */}
      </Link>

      {/* Placeholder to balance header */}
      <div className="w-8"></div> {/* Adjust width if needed */}
    </header>
  );
};


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar(); // Get sidebar context
  const router = useRouter(); // Use router for navigation after ad

  const mainMenuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: BarChart3 }, // Mark for interstitial ad
    { href: '/history', label: 'History', icon: History }, // Mark for interstitial ad
    { href: '/currency', label: 'Currency', icon: DollarSign } // Mark for interstitial ad
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
       event.preventDefault(); // Prevent default link behavior initially

       // Close mobile sidebar if open
       if (isMobile) {
         setOpenMobile(false);
       }

        router.push(item.href);
   };


  return (
    <> {/* Removed SidebarProvider wrap as it's now in layout.tsx */}
       {/* AdMob Banner Placement */}
       {/* AdComponent renders AdInitializer which handles the banner */}
       {/*<AdComponent />*/}

       {/* Desktop Sidebar */}
       <Sidebar className="hidden md:flex md:flex-col">
         <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
           <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
             <Wallet className="w-6 h-6" /> {/* Use Wallet icon */}
             <span>{APP_NAME}</span> {/* Use consistent app name */}
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
                   <Link href={item.href} onClick={(e) => handleLinkClick(item, e)}>
                     <item.icon className="h-4 w-4"/>
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
                        <Link href={item.href} onClick={(e) => handleLinkClick(item, e)}>
                         <item.icon className="h-4 w-4"/>
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
       <SidebarInset className="flex flex-col min-h-screen">
         {/* Mobile Header */}
         <MobileHeader />

         {/* Content - Add padding bottom to avoid overlap with fixed banner */}
         {/* Adjust pb value if banner height differs or causes overlap */}
         <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-8">
           {children}
         </main>

       </SidebarInset>
      </>
  );
}
