// src/components/layout/app-layout.tsx
"use client";

import React, { useState, useEffect, useCallback, Fragment } from 'react';
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
  SidebarSeparator, // Added SidebarSeparator
  SidebarSheetContent // Use the custom SidebarSheetContent
} from '@/components/ui/sidebar';
import {
  Menu as MenuIcon, // Renamed Menu to avoid conflict
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Info,
  Mail,
  ShieldCheck as PolicyIcon, // Renamed ShieldCheck to Policy
  FileText as ArticleIcon,   // Renamed FileText to Article
  Star,
  AppWindow as AppsIcon,      // Corrected AppsIcon to AppWindow
  X,
  DollarSign, // Added for Currency
  Palette,    // Added for Themes
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
// import { useAuth } from '@/context/auth-context'; // Removed useAuth import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_LIST_ROUTE = '/list';
const AUTH_ROUTE = '/auth'; // Define AUTH_ROUTE

// --- Mobile Header Component ---
const MobileHeader: React.FC<{ onMenuToggle: () => void; isMenuOpen: boolean }> = ({ onMenuToggle, isMenuOpen }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <SheetTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onMenuToggle} className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
           <AnimatePresence initial={false} mode="wait">
             <motion.div
                key={isMenuOpen ? "x" : "menu"}
                initial={{ rotate: isMenuOpen ? -90 : 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: isMenuOpen ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </motion.div>
           </AnimatePresence>
           <span className="sr-only">Toggle Sidebar</span>
          </Button>
       </SheetTrigger>

      {/* Centered App Name/Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>
      {/* Right Side: Placeholder - No profile icon for now as per removal of auth */}
      <div className="w-10 h-10"></div> {/* Placeholder to balance the flex layout */}
    </header>
  );
};


// --- Main Menu Content ---
interface MainMenuContentProps {
  onLinkClick?: () => void;
  isMobile?: boolean;
}

const MainMenuContent: React.FC<MainMenuContentProps> = ({ onLinkClick, isMobile = false }) => {
  const pathname = usePathname();
  const router = useRouter();
  // const { user, logout, isAuthenticated } = useAuth(); // Auth logic removed
  // const { dispatch: appDispatch } = useAppContext(); // appDispatch removed as logout is gone

  const handleLinkClick = useCallback((href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (e) e.preventDefault();
    if (onLinkClick) onLinkClick();
    router.push(href);
  }, [onLinkClick, router]);

  // const handleLogout = async () => { // Logout logic removed
  //   await logout();
  //   if (onLinkClick) onLinkClick();
  //   // Middleware should handle redirection to /auth after logout if auth was present
  //   router.push(AUTH_ROUTE); // Simple redirect to auth page for now
  // };

  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const secondaryMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
    { href: '/premium', label: 'Unlock Premium', icon: Palette } // Keep premium showcase page link
  ];

  const renderMenuItem = (item: typeof mainNavItems[0] | typeof secondaryMenuItems[0]) => {
    const linkContent = (
      <>
        <item.icon className={cn("transition-colors h-4 w-4 shrink-0", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
        <span className={cn("transition-colors text-sm", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
      </>
    );

    const commonButtonProps = {
      asChild: true,
      isActive: pathname === item.href,
      className: cn(
        "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out hover:text-white hover:border-secondary/50 hover:shadow-neon focus:shadow-neon-lg glow-border-inner p-0",
        pathname === item.href ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30" : "hover:bg-primary/10 hover:border-primary/30",
      ),
    };

    const interactiveElement = (
      <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)} className="flex items-center gap-2 w-full h-full p-2">
        {linkContent}
      </Link>
    );
    
    // Wrap with SheetClose if it's a mobile menu item
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton {...commonButtonProps}>
          {isMobile ? <SheetClose asChild>{interactiveElement}</SheetClose> : interactiveElement}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };


  return (
    <Fragment>
      <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow flex flex-col">
        <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto">
          {/* Since auth is removed, all users see all menu items. Adjust if needed */}
          {mainNavItems.map(item => renderMenuItem(item))}
          <SidebarSeparator className="my-2" />
          {secondaryMenuItems.map(item => renderMenuItem(item))}
        </SidebarMenu>
      </SidebarContent>
      {/* Logout button removed as auth is removed */}
    </Fragment>
  );
};


const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  // const authState = useAuth(); // Auth logic removed
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isClientMounted = appContext.state.isInitialDataLoaded; // Use app context for client mount check

  // const isLoading = appContext.isLoading || authState.isLoading; // Simplified loading state
  const isLoading = appContext.isLoading;

  const toggleMobileSidebar = useCallback(() => {
    setIsSheetOpen(prev => !prev);
  }, []);

   // --- Redirect Logic (Simplified for no-auth) ---
   useEffect(() => {
    if (isClientMounted && !isLoading) {
      const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;

      if (!hasLists && pathname !== CREATE_FIRST_LIST_ROUTE) {
        console.log("AppLayoutContent: No lists, redirecting to create-first.");
        router.replace(CREATE_FIRST_LIST_ROUTE);
      } else if (hasLists && pathname === CREATE_FIRST_LIST_ROUTE) {
        console.log("AppLayoutContent: Has lists, on create-first. Redirecting to /list.");
        router.replace(DEFAULT_LIST_ROUTE);
      }
    }
  }, [isClientMounted, isLoading, appContext.state.lists, pathname, router]);


  if (isLoading || !isClientMounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Removed auth specific redirects like to /auth page

  return (
     <Fragment>
       {/* Mobile Header */}
       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
         <MobileHeader onMenuToggle={toggleMobileSidebar} isMenuOpen={isSheetOpen} />
         <SidebarSheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
           <MainMenuContent onLinkClick={() => setIsSheetOpen(false)} isMobile={true} />
         </SidebarSheetContent>
       </Sheet>

       {/* Desktop Sidebar */}
       <Sidebar className="hidden md:flex md:flex-col">
         <MainMenuContent isMobile={false}/>
       </Sidebar>

       <SidebarInset>
         <main className="flex-1 flex flex-col md:px-6 lg:px-8 xl:px-10 md:py-4 bg-background overflow-y-auto max-w-full">
            {/* Adjust main content padding to prevent overlap with fixed banner */}
            <div className="flex-grow pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {children}
            </div>
         </main>
       </SidebarInset>
     </Fragment>
   );
};


export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No need for AuthProvider here as auth is removed.
  // SidebarProvider is also removed as its context is managed within AppLayoutContent or directly by Sheet
  return (
    <TooltipProvider delayDuration={0}>
        <AppLayoutContent>{children}</AppLayoutContent>
    </TooltipProvider>
  );
};
