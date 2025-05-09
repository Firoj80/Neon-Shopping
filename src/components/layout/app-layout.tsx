
"use client";

import React, { useState, useEffect, Fragment, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Sheet,
  SheetContent,
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
  SidebarSheetContent // Use the custom SidebarSheetContent
} from '@/components/ui/sidebar';

import {
  Menu as MenuIcon, // Renamed Menu to avoid conflict
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Palette, // For Themes
  Info,
  Mail,
  ShieldCheck as PolicyIcon, // Renamed for clarity
  FileText as ArticleIcon, // Renamed for clarity
  Star,
  AppWindow as AppsIcon, // Corrected AppsIcon to AppWindow
  X,
  Crown // For Premium
} from 'lucide-react';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from '@/context/auth-context'; // Import useAuth

// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // State for Sheet open/close

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger asChild>
           <Button variant="ghost" size="icon" className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
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
           </Button>
         </SheetTrigger>
         <SidebarSheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
           <MainMenuContent onLinkClick={() => setIsOpen(false)} isMobile={true}/>
         </SidebarSheetContent>
       </Sheet>

      {/* Center: App Name/Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
           <ShoppingCart className="w-6 h-6" />
           <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>


      {/* Right Side: Placeholder for potential actions or leave empty for centered title */}
      <div className="w-10"></div> {/* This acts as a spacer to balance the menu icon */}
    </header>
  );
};


// --- Main Menu Content (for Mobile Sheet and Desktop Sidebar) ---
interface MainMenuContentProps {
  onLinkClick?: () => void;
  isMobile?: boolean;
}
const MainMenuContent: React.FC<MainMenuContentProps> = ({ onLinkClick, isMobile = false }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();

  const handleLinkClick = useCallback((href: string, e?: React.MouseEvent<HTMLAnchorElement>) => {
    if (e) e.preventDefault();
    if (onLinkClick) {
      onLinkClick();
    }
    setTimeout(() => {
      router.push(href);
    }, isMobile ? 150 : 0); // Delay for sheet close animation on mobile
  }, [onLinkClick, router, isMobile]);

  const handleLogout = () => {
    if (onLinkClick) onLinkClick(); // Close sheet if on mobile
    logout();
    router.push('/auth'); // Redirect to auth page after logout
  };


  const mainMenuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
    { href: '/premium', label: 'Go Premium', icon: Crown }, // Added Premium link
  ];

  const secondaryMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: typeof mainMenuItems[0] | typeof secondaryMenuItems[0]) => {
    const clickHandler = (e: React.MouseEvent<HTMLAnchorElement>) => {
      handleLinkClick(item.href, e);
    };

    const menuItemButton = (
      <SidebarMenuButton
        asChild
        isActive={pathname === item.href}
        className={cn(
          "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out",
          "text-neonText hover:text-white", // Use neonText for default
          "hover:border-secondary/50 hover:shadow-neon focus:shadow-neon-lg glow-border-inner",
          pathname === item.href
            ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30"
            : "hover:bg-primary/10 hover:border-primary/30"
        )}
      >
        <Link href={item.href} onClick={clickHandler}>
          <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
          <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    );

    return (
      <SidebarMenuItem key={item.href}>
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
          {mainMenuItems.map(renderMenuItem)}
          <SidebarSeparator className="my-2" />
          {secondaryMenuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter className="p-4 border-t border-sidebar-border shrink-0">
        {isAuthenticated ? (
          <Button
            variant="outline"
            className="w-full justify-center text-red-400 hover:text-red-300 hover:bg-destructive/20 border-red-500/50 glow-border-inner"
            onClick={handleLogout}
          >
            <X className="mr-2 h-4 w-4" /> Logout
          </Button>
        ) : (
           <Button
            variant="outline"
            className="w-full justify-center text-primary hover:text-primary/80 hover:bg-primary/10 border-primary/50 glow-border-inner"
            onClick={() => handleLinkClick('/auth')}
           >
            Login / Sign Up
           </Button>
        )}
      </SidebarFooter>
    </>
  );
};


// --- Main AppLayoutContent Component ---
interface AppLayoutContentProps {
  children: React.ReactNode;
}

const AppLayoutContent: React.FC<AppLayoutContentProps> = ({ children }) => {
  const appContext = useAppContext();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth(); // Get auth state
  const router = useRouter();
  const pathname = usePathname();
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const isLoading = appContext.isLoading || authLoading; // Combined loading state

   // --- Redirect Logic ---
   // Moved inside useEffect to prevent rendering during rendering
   useEffect(() => {
     if (isClientMounted && !isLoading) {
       const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
       if (isAuthenticated) {
         if (!hasLists && pathname !== '/list/create-first' && pathname !== '/auth') {
           router.replace('/list/create-first');
         } else if (hasLists && pathname === '/list/create-first') {
           router.replace('/list');
         } else if (pathname === '/auth') {
           router.replace('/list');
         }
       } else { // Not authenticated
         if (pathname !== '/auth') {
           router.replace('/auth');
         }
       }
     }
   }, [isClientMounted, isLoading, isAuthenticated, appContext.state.lists, pathname, router]);



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

  // If on /auth page, render only children (the auth page itself)
  if (pathname === '/auth') {
    return <>{children}</>;
  }

  // --- Render full layout ---
  return (
     <>
       <MobileHeader />

        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex md:flex-col">
         <MainMenuContent />
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset>
         <main className="flex-1 flex flex-col md:px-4 lg:px-6 xl:px-8 md:py-3 bg-background overflow-y-auto max-w-full">
            {children}
          </main>
        </SidebarInset>
     </>
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
