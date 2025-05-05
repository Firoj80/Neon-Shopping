
"use client";
import React from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  LayoutGrid as Dashboard, // Alias LayoutGrid to Dashboard
  History,
  Settings,
  Info as InfoIcon, // Alias Info to InfoIcon
  Mail,
  ShieldCheck as Policy, // Alias ShieldCheck to Policy
  FileText as Article, // Alias FileText to Article
  Star,
  Store as Apps, // Alias Store to Apps
  Menu,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProvider, useSidebar, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar'; // Import Sidebar component
import { showPreparedInterstitialAd } from '@/components/admob/ad-initializer'; // Import the AdMob function
import { AdInitializer } from '@/components/admob/ad-initializer'; // Import AdInitializer
import ClientOnly from '@/components/client-only'; // Import ClientOnly


// --- Mobile Header Component ---
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
        <ShoppingCart className="w-6 h-6" /> {/* Use Cart icon */}
        <span className="font-bold">Neon Shopping</span> {/* Updated App Name */}
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

  // AdMob Interstitial Trigger Routes
  const interstitialTriggerRoutes = ['/stats', '/history']; // Removed /currency

  // Menu Items & Icons - Adjusted list and icons
  const menuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: Dashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/about', label: 'About Us', icon: InfoIcon },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy },
    { href: '/terms', label: 'Terms of Service', icon: Article },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: Apps },
  ];


  const handleLinkClick = async (item: { href: string }, event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
     event.preventDefault(); // Prevent default link behavior initially

     // Close mobile sidebar if open
    if (isMobile) {
      setOpenMobile(false);
    }

    // Interstitial Ad Logic
    if (interstitialTriggerRoutes.includes(item.href)) {
      console.log(`Interstitial triggered for: ${item.href}`);
      try {
        await showPreparedInterstitialAd(); // Attempt to show the ad
      } catch (error) {
        console.error("Error showing interstitial ad on click:", error);
      } finally {
        // Wait a tiny bit before navigation to allow ad to potentially show/dismiss
        setTimeout(() => router.push(item.href), 100);
      }
    } else {
      // Navigate directly
      router.push(item.href);
    }
  };


   const menuItemClasses = cn(
     "group/menu-item relative flex items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm", // Adjusted gap and padding
     "border border-primary/30 hover:border-white", // Neon cyan border, white on hover
     "transition-all duration-300 ease-in-out", // Smooth transitions
     "hover:text-white hover:shadow-[0_0_12px_2px_theme(colors.white/0.6),0_0_4px_theme(colors.white/0.8)]", // White glow on hover
     "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:shadow-[0_0_12px_2px_theme(colors.white/0.6),0_0_4px_theme(colors.white/0.8)]", // Focus glow
     "[&_svg]:size-5 [&_svg]:shrink-0", // Icon size adjusted
     "[&_span:last-child]:truncate" // Truncate text
   );


   const activeItemClasses = cn(
     "bg-primary/20 text-primary font-medium border-primary shadow-[0_0_10px_theme(colors.primary/0.8)]", // Active state cyan glow
     "hover:text-white hover:border-white hover:shadow-[0_0_15px_3px_theme(colors.white/0.7),0_0_5px_theme(colors.white/0.9)]" // Intensified white glow on hover when active
   );

  return (
    <> {/* Removed SidebarProvider wrap as it's now in layout.tsx */}
       {/* AdMob Banner Placement */}
       <ClientOnly>
        <AdInitializer />
       </ClientOnly>

       {/* Desktop Sidebar */}
       <Sidebar className="hidden md:flex md:flex-col">
        <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
          <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
             <ShoppingCart className="w-6 h-6" /> {/* Use ShoppingCart icon */}
            <span className="font-bold">Neon Shopping</span> {/* Ensure this name is consistent */}
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col"> {/* Use flex-col */}
          {/* Combined Menu Items */}
          <SidebarMenu className="flex-grow space-y-1.5"> {/* Adjusted spacing */}
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
                    <span className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
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
        {/* Adjusted padding-bottom to avoid content being hidden by potential fixed elements (like the ad placeholder) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-[70px]"> {/* Increased bottom padding for banner */}
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

    