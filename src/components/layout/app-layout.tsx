
"use client";

import React, { useState, useEffect, Fragment, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Info,
  Mail,
  ShieldCheck as Policy, 
  FileText as ArticleIcon,
  Star,
  AppWindow as AppsIcon, 
  Menu as MenuIcon, 
  X,
  Palette, // Added for Themes
} from 'lucide-react';
import { Button, buttonVariants } from '../ui/button'; // Import buttonVariants
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent, // Renamed SidebarSheetContent back to SheetContent for direct use
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
  // SidebarSheetContent is now SheetContent directly from ui/sheet
} from '@/components/ui/sidebar';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed useClientOnly as it's not used directly in this file anymore
// import { useClientOnly } from '@/hooks/use-client-only';

// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger asChild>
           <button className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "mr-2 text-primary hover:text-primary/80 hover:bg-primary/10")}>
             <AnimatePresence initial={false} mode="wait">
               <motion.div
                 key={isOpen ? "x" : "menu"}
                 initial={{ rotate: isOpen ? -90 : 90, opacity: 0 }}
                 animate={{ rotate: 0, opacity: 1 }}
                 exit={{ rotate: isOpen ? 90 : -90, opacity: 0 }}
                 transition={{ duration: 0.2 }}
               >
                 {isOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
               </motion.div>
             </AnimatePresence>
             <span className="sr-only">Toggle Sidebar</span>
           </button>
         </SheetTrigger>
         <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground"> {/* Ensure SheetContent gets correct props */}
           <MainMenuContent onLinkClick={() => setIsOpen(false)} isMobile={true}/>
         </SheetContent>
       </Sheet>

      {/* Center: App Name/Logo */}
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
           <ShoppingCart className="w-6 h-6" />
           <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>

      {/* Right Side: Placeholder for potential icons or empty span for spacing */}
      <span className="w-10 h-10"></span> {/* Spacer to help center title */}
    </header>
  );
};


// --- Main Menu Content (Reusable for Mobile Sheet and Desktop Sidebar) ---
interface MainMenuContentProps {
  onLinkClick?: () => void;
  isMobile?: boolean;
}
const MainMenuContent: React.FC<MainMenuContentProps> = ({ onLinkClick, isMobile = false }) => {
  const pathname = usePathname();
  const router = useRouter();
  // Removed unused appContext and dispatch

  const handleLinkClick = useCallback((href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onLinkClick) {
      onLinkClick();
    }
    setTimeout(() => {
      router.push(href);
    }, 150);
  }, [onLinkClick, router]);

  const menuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette}, // Added Themes
    { type: 'separator' as const }, // Indicate separator
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: typeof menuItems[number], index: number) => {
    if (item.type === 'separator') {
      return <SidebarSeparator key={`separator-${index}`} className="my-2" />;
    }

    const { href, label, icon: ItemIcon } = item;

    const clickHandler = (e: React.MouseEvent<HTMLAnchorElement>) => {
      handleLinkClick(href, e);
    };

    const menuItemButton = (
      <SidebarMenuButton
        asChild
        isActive={pathname === href}
        className={cn(
          "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out",
          "text-neonText hover:text-white",
          "border border-primary/30 hover:border-secondary/50 hover:shadow-neon focus:shadow-neon-lg",
          pathname === href
            ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30"
            : "hover:bg-primary/10 hover:border-primary/30 hover:shadow-neon"
        )}
      >
        <Link href={href} onClick={clickHandler}>
          <ItemIcon className={cn("transition-colors", pathname === href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
          <span className={cn("transition-colors text-neonText", pathname === href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{label}</span>
        </Link>
      </SidebarMenuButton>
    );

    return (
      <SidebarMenuItem key={href}>
        {isMobile ? <SheetClose asChild>{menuItemButton}</SheetClose> : menuItemButton}
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow flex flex-col">
        <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto">
          {menuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
      {/* Removed SidebarFooter for simplicity, can be re-added if needed */}
    </>
  );
};

// --- Main AppLayoutContent Component ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isClientMounted, setIsClientMountedHook] = useState(false); // Renamed to avoid conflict

  useEffect(() => {
    setIsClientMountedHook(true);
  }, []);

  useEffect(() => {
    setIsLoading(appContext.isLoading);
  }, [appContext.isLoading]);

  useEffect(() => {
    if (isClientMounted && !isLoading) {
      const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
      if (!hasLists && pathname !== '/list/create-first' && pathname !== '/auth') {
         router.replace('/list/create-first');
      } else if (hasLists && pathname === '/list/create-first') {
         router.replace('/list');
      }
    }
  }, [isClientMounted, isLoading, appContext.state.lists, pathname, router]);

  if (!isClientMounted || isLoading) {
    return (
      <div className="flex items-center justify-center fixed inset-0 bg-background/90 z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
        </div>
      </div>
    );
  }

  return (
     <Fragment>
       <MobileHeader />
       <Sidebar className="hidden md:flex md:flex-col">
         <MainMenuContent />
       </Sidebar>
       <SidebarInset>
         <main className="flex-1 flex flex-col md:p-6 lg:p-8 xl:px-10 xl:py-6 bg-background overflow-y-auto">
           {children}
         </main>
       </SidebarInset>
     </Fragment>
  );
}

// --- Main AppLayout Component (Wrapper) ---
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TooltipProvider delayDuration={0}>
       <AppLayoutContent>{children}</AppLayoutContent>
    </TooltipProvider>
  );
};

export default AppLayout;
