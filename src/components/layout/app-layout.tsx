"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Palette, // Keep Palette for Themes if needed, or remove if Themes page is also removed
  Info,
  Mail,
  ShieldCheck as Policy,
  FileText as ArticleIcon, // Using FileText for Terms
  Star,
  AppWindow as AppsIcon,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useClientOnly } from '@/hooks/use-client-only';


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
     <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10 w-10 h-10 flex-shrink-0">
             <AnimatePresence initial={false} mode="wait">
               <motion.div
                  key={isOpen ? "x" : "menu"}
                  initial={{ rotate: isOpen ? 90 : -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: isOpen ? -90 : 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                 {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
               </motion.div>
             </AnimatePresence>
            <span className="sr-only">Toggle Sidebar</span>
           </Button>
         </SheetTrigger>
         {/* Use SidebarSheetContent for mobile */}
          <SidebarSheetContent side="left" className="w-[280px]" isOpen={isOpen} setIsOpen={setIsOpen} />
       </Sheet>

       {/* Center: App Name/Logo */}
       <div className="flex-grow text-center">
           <Link href="/list" className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
               <ShoppingCart className="w-6 h-6" />
                <ClientOnly><span className="font-bold text-neonText">Neon Shopping</span></ClientOnly>
           </Link>
       </div>

       {/* Right Side: Placeholder */}
        <div className="w-10 h-10 flex-shrink-0"></div>
     </header>
  );
};

// --- Mobile Sidebar Content Component (Now using SidebarSheetContent) ---
const SidebarSheetContent: React.FC<{ side: "left" | "right"; className?: string; isOpen: boolean; setIsOpen: (open: boolean) => void }> = ({ side, className, isOpen, setIsOpen }) => {
    const router = useRouter();
    const pathname = usePathname();
    const isClient = useClientOnly();

    // Define menu items
    const menuItems = [
        { href: '/list', label: 'Shopping List', icon: ShoppingCart },
        { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/history', label: 'History', icon: History },
        { href: '/settings', label: 'Settings', icon: Settings }, // Settings might include Themes now
        { href: '/themes', label: 'Themes', icon: Palette },
        { href: '/about', label: 'About Us', icon: Info },
        { href: '/contact', label: 'Contact Us', icon: Mail },
        { href: '/privacy', label: 'Privacy Policy', icon: Policy },
        { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
        { href: '/rate', label: 'Rate App', icon: Star },
        { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
    ];

    const handleLinkClick = (itemHref: string, event?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        event?.preventDefault();
        router.push(itemHref);
        setIsOpen(false); // Close sidebar on link click
    };

    const menuItemClasses = cn(
        "group/menu-item relative flex items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm",
        "border border-primary/30 hover:border-secondary hover:bg-primary/10 shadow-[0_0_5px_theme(colors.primary.DEFAULT)/0.5] hover:shadow-[0_0_10px_theme(colors.secondary.DEFAULT)/0.7,0_0_4px_theme(colors.secondary.DEFAULT)/0.9]",
        "transition-all duration-300 ease-in-out glow-border-inner",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:shadow-[0_0_12px_2px_theme(colors.secondary.DEFAULT)/0.6,0_0_4px_theme(colors.secondary.DEFAULT)/0.8)]",
        "[&_svg]:size-5 [&_svg]:shrink-0",
        "[&_span:last-child]:truncate"
    );

    const activeItemClasses = cn(
        "bg-primary/20 text-primary font-medium border-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)/0.8]",
        "hover:text-secondary hover:border-secondary hover:shadow-[0_0_15px_3px_theme(colors.secondary.DEFAULT)/0.7,0_0_5px_theme(colors.secondary.DEFAULT)/0.9)]"
    );

    const isItemActive = useCallback((itemHref: string) => {
        if (!isClient) return false;
        return pathname === itemHref;
    }, [pathname, isClient]);

    return (
         <SheetContent
            side={side}
            className={cn("p-0 flex flex-col bg-sidebar text-sidebar-foreground border-sidebar-border glow-border", className)}
            overlayClassName="backdrop-blur-sm" // Example: Add blur to overlay
            accessibleTitle="Main Navigation Menu"
        >
            <SheetHeader className="p-4 border-b border-sidebar-border shrink-0">
                <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary" onClick={() => setIsOpen(false)}>
                    <ShoppingCart className="w-6 h-6" />
                     <ClientOnly><span className="font-bold text-neonText">Neon Shopping</span></ClientOnly>
                </Link>
            </SheetHeader>
            <SidebarContent className="p-2 flex-grow overflow-y-auto">
                <SidebarMenu className="space-y-1.5">
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={isItemActive(item.href)}
                                className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
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
            <SidebarFooter className="p-2 border-t border-sidebar-border">
                <hr className="my-3 border-sidebar-border/50" />
                <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
            </SidebarFooter>
        </SheetContent>
    );
};

// --- Main App Layout Component ---
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const appContext = useAppContext();
  const { isLoading } = appContext;
  const isClientMounted = useClientOnly(); // Hook to ensure client-side execution

  // Define menu items for desktop sidebar - Removed Currency
    const mainNavItems = [
        { href: '/list', label: 'Shopping List', icon: ShoppingCart },
        { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/history', label: 'History', icon: History },
        { href: '/settings', label: 'Settings', icon: Settings },
        { href: '/themes', label: 'Themes', icon: Palette },
        { href: '/about', label: 'About Us', icon: Info },
        { href: '/contact', label: 'Contact Us', icon: Mail },
        { href: '/privacy', label: 'Privacy Policy', icon: Policy },
        { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
        { href: '/rate', label: 'Rate App', icon: Star },
        { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
    ];

  const menuItemClasses = cn(
    "group/menu-item relative flex items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm",
    "border border-primary/30 hover:border-secondary hover:bg-primary/10 shadow-[0_0_5px_theme(colors.primary.DEFAULT)/0.5] hover:shadow-[0_0_10px_theme(colors.secondary.DEFAULT)/0.7,0_0_4px_theme(colors.secondary.DEFAULT)/0.9]",
    "transition-all duration-300 ease-in-out glow-border-inner",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:shadow-[0_0_12px_2px_theme(colors.secondary.DEFAULT)/0.6,0_0_4px_theme(colors.secondary.DEFAULT)/0.8)]",
    "[&_svg]:size-5 [&_svg]:shrink-0",
    "[&_span:last-child]:truncate"
  );

  const activeItemClasses = cn(
    "bg-primary/20 text-primary font-medium border-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)/0.8]",
    "hover:text-secondary hover:border-secondary hover:shadow-[0_0_15px_3px_theme(colors.secondary.DEFAULT)/0.7,0_0_5px_theme(colors.secondary.DEFAULT)/0.9)]"
  );

  const isItemActive = useCallback((itemHref: string) => {
    if (!isClientMounted) return false; // Don't determine active state on server
    return pathname === itemHref;
  }, [pathname, isClientMounted]);

  useEffect(() => {
    // Redirect logic based on list existence
    if (isClientMounted && !isLoading) {
      const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
      if (!hasLists && pathname !== '/list/create-first') {
        router.replace('/list/create-first');
      } else if (hasLists && pathname === '/list/create-first') {
        router.replace('/list');
      }
    }
  }, [isClientMounted, isLoading, appContext.state.lists, pathname, router]);

  // --- Loading State ---
  if (!isClientMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prevent rendering main layout if redirection is happening or should happen
   if (Array.isArray(appContext.state.lists) && appContext.state.lists.length === 0 && pathname !== '/list/create-first') {
       return (
         <div className="flex items-center justify-center h-screen bg-background">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
         </div>
       );
   }

   if (Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0 && pathname === '/list/create-first') {
       return (
         <div className="flex items-center justify-center h-screen bg-background">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
         </div>
       );
   }


  // --- Render full layout ---
   return (
     <React.Fragment>
       {/* Desktop Sidebar */}
       <Sidebar className="hidden md:flex md:flex-col">
         <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
           <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
             <ShoppingCart className="w-6 h-6" />
             <ClientOnly><span className="font-bold text-neonText">Neon Shopping</span></ClientOnly>
           </Link>
         </SidebarHeader>
         <SidebarContent className="p-2 flex flex-col flex-grow overflow-y-auto">
           <SidebarMenu className="space-y-1.5 flex-grow">
             {mainNavItems.map((item) => (
               <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                      asChild
                      isActive={isItemActive(item.href)}
                      tooltip={item.label}
                      className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                  >
                   <Link href={item.href}>
                      <item.icon className={cn("transition-colors", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                      <span className={cn("transition-colors text-neonText", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                   </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
             ))}
           </SidebarMenu>
            {/* Separator removed from here, footer handles it */}
         </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
            <hr className="my-3 border-sidebar-border/50" />
            <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
         </SidebarFooter>
       </Sidebar>

       {/* Main Content Area */}
       <SidebarInset className="flex flex-col min-h-screen">
          <MobileHeader />
         <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-[calc(1rem+env(safe-area-inset-bottom)+50px)] md:pb-[calc(1.5rem+env(safe-area-inset-bottom)+50px)]">
           {children}
         </main>
         {/* Ad Banner Placeholder */}
         <div className="fixed bottom-0 left-0 right-0 h-[50px] bg-card/90 backdrop-blur-sm border-t border-border/30 flex items-center justify-center text-xs text-muted-foreground z-40 glow-border shadow-neon-lg">
           <ClientOnly><span className='text-muted-foreground/70'>Ad Banner Area</span></ClientOnly>
         </div>
       </SidebarInset>
     </React.Fragment>
   );
}
