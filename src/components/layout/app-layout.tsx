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
  UserCircle,
  DollarSign,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProvider, useSidebar, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { showPreparedInterstitialAd, prepareInterstitialAd } from '@/components/admob/ad-initializer'; // Import the AdMob functions

// Placeholder for AdComponent if needed later
// import dynamic from 'next/dynamic';
// const AdComponent = dynamic(() => import('@/components/admob/ad-component').then(mod => mod.AdComponent), {
//     ssr: false,
//     loading: () => <div className="fixed bottom-0 left-0 right-0 h-[50px] bg-background/50 flex items-center justify-center text-xs text-muted-foreground z-40">Loading Ad...</div>
// });


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const { isMobile, openMobile, toggleSidebar } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const profileMenuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: Dashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isDropdownItemActive = (itemHref: string) => {
    if (!isClientMounted) {
      return false;
    }
    return pathname === itemHref;
  };

  if (!isMobile) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
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

      <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
         <ShoppingCart className="w-6 h-6" />
         <span className="font-bold text-neonText">Neon Shopping</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-2 text-primary hover:text-primary/80 hover:bg-primary/10">
            <UserCircle className="h-6 w-6" />
            <span className="sr-only">User Profile</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border-primary/50 shadow-neon glow-border mr-2" align="end">
          <DropdownMenuItem className="font-semibold text-primary px-2 py-1.5">My Account</DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/50" />
          {profileMenuItems.map((item) => (
            <DropdownMenuItem
              key={item.href}
              onClick={() => {
                // showPreparedInterstitialAd(); // Show ad if prepared
                router.push(item.href);
                if (openMobile) toggleSidebar(); // Close sidebar if open
              }}
              className={cn(
                "flex items-center gap-2 cursor-pointer p-2 text-sm text-neonText hover:bg-primary/10 focus:bg-primary/20 focus:text-primary data-[active]:bg-primary/20 data-[active]:text-primary",
                isDropdownItemActive(item.href) && "bg-primary/10 text-primary font-medium"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};


// --- App Layout Component ---
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, openMobile, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

   const mainMenuDefinition = [
     { href: '/about', label: 'About Us', icon: InfoIcon, triggerAd: false },
     { href: '/contact', label: 'Contact Us', icon: Mail, triggerAd: false },
     { href: '/privacy', label: 'Privacy Policy', icon: Policy, triggerAd: false },
     { href: '/terms', label: 'Terms of Service', icon: Article, triggerAd: false },
     { href: '/rate', label: 'Rate App', icon: Star, triggerAd: false },
     { href: '/more-apps', label: 'More Apps', icon: Apps, triggerAd: false },
   ];

   const profileMenuDefinition = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: Dashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLinkClick = (itemHref: string, event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
     event.preventDefault();
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
    // Example: Trigger interstitial ad for specific routes
    // if (itemHref === '/stats' || itemHref === '/history' || itemHref === '/settings') {
    //   showPreparedInterstitialAd(); // Show ad if prepared
    // }
    router.push(itemHref);
  };

   const menuItemClasses = cn(
     "group/menu-item relative flex items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm glow-border-inner",
     "border border-primary/30 hover:border-secondary hover:bg-primary/10 shadow-[0_0_5px_theme(colors.primary.DEFAULT)/0.5] hover:shadow-[0_0_10px_theme(colors.secondary.DEFAULT)/0.7,0_0_4px_theme(colors.secondary.DEFAULT)/0.9]",
     "transition-all duration-300 ease-in-out",
     "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:shadow-[0_0_12px_2px_theme(colors.secondary.DEFAULT)/0.6,0_0_4px_theme(colors.secondary.DEFAULT)/0.8)]",
     "[&_svg]:size-5 [&_svg]:shrink-0",
     "[&_span:last-child]:truncate"
   );

   const activeItemClasses = cn(
     "bg-primary/20 text-primary font-medium border-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)/0.8]",
     "hover:text-secondary hover:border-secondary hover:shadow-[0_0_15px_3px_theme(colors.secondary.DEFAULT)/0.7,0_0_5px_theme(colors.secondary.DEFAULT)/0.9)]"
   );

  const isItemActive = (itemHref: string) => {
    if (!isClientMounted) {
      return false;
    }
    return pathname === itemHref;
  };

  return (
    <>
       {/* <AdComponent /> */}

       <Sidebar className="hidden md:flex md:flex-col">
        <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
           <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
             <ShoppingCart className="w-6 h-6" />
            <span className="font-bold text-neonText">Neon Shopping</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col">
           <SidebarMenu className="space-y-1.5">
            {profileMenuDefinition.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item.href)}
                  tooltip={item.label}
                   className={cn(
                     menuItemClasses,
                     isItemActive(item.href) && activeItemClasses
                   )}
                >
                   <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                     <item.icon className={cn("transition-colors", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                     <span className={cn("transition-colors text-neonText", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <hr className="my-3 border-sidebar-border/50" />
           <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto">
            {mainMenuDefinition.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item.href)}
                  tooltip={item.label}
                   className={cn(
                     menuItemClasses,
                     isItemActive(item.href) && activeItemClasses
                   )}
                >
                   <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                     <item.icon className={cn("transition-colors", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                     <span className={cn("transition-colors text-neonText", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
        </SidebarFooter>
      </Sidebar>

      <Sidebar className="md:hidden" side="left" collapsible="offcanvas">
        <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
          <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary" onClick={() => setOpenMobile(false)}>
            <ShoppingCart className="w-6 h-6" />
            <span className="font-bold text-neonText">Neon Shopping</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col">
           <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto">
           {mainMenuDefinition.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item.href)}
                   className={cn(
                     menuItemClasses,
                     isItemActive(item.href) && activeItemClasses
                   )}
                >
                   <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                     <item.icon className={cn("transition-colors", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                     <span className={cn("transition-colors text-neonText", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         <SidebarFooter className="p-2 border-t border-sidebar-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-screen">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-[calc(1rem+env(safe-area-inset-bottom)+50px)] md:pb-[calc(1.5rem+env(safe-area-inset-bottom)+50px)]"> {/* Adjusted padding for potential banner */}
          {children}
        </main>
        {/* Placeholder for AdMob banner at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 h-[50px] bg-card/90 backdrop-blur-sm border-t border-border/30 flex items-center justify-center text-xs text-muted-foreground z-40 glow-border shadow-neon-lg">
           {/* AdMob Banner Ad Placeholder */}
           {/* Note: Actual AdMob integration requires native-level code or specific Capacitor plugins */}
           <span className='text-muted-foreground/70'>Ad Banner Area</span>
        </div>
      </SidebarInset>
    </>
  );
}
