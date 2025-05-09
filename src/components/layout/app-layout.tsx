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
  SidebarSheetContent
} from '@/components/ui/sidebar';
import {
  Menu as MenuIcon,
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Palette,
  Info,
  Mail,
  ShieldCheck as PolicyIcon, // Renamed for clarity
  FileText as ArticleIcon,  // Renamed for clarity
  Star,
  AppWindow as AppsIcon,    // Corrected import
  X,
  DollarSign,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from '@/context/auth-context';
import { Toaster } from "@/components/ui/toaster";
import { useClientOnly } from '@/hooks/use-client-only';


const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';
const APP_ROOT_ROUTE = '/';
// Define paths that are considered part of the authenticated app area
const AUTHENTICATED_AREA_PATHS = ['/list', '/stats', '/history', '/settings', '/themes', '/premium', '/premium-plans'];


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();

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
           <MainMenuContent onLinkClick={() => setIsOpen(false)} isMobile={true} />
         </SidebarSheetContent>
       </Sheet>

      {/* Centered App Name/Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>

      {/* Right Side: Placeholder for potential actions or profile icon if re-added */}
      <div className="w-10 h-10 flex items-center justify-center">
         {/* If auth is loading or user is not authenticated, this space can be empty or show a login button */}
         {authIsLoading ? (
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted"></div>
         ) : !isAuthenticated ? (
            <Button variant="ghost" size="sm" asChild className="text-primary glow-border-inner">
                <Link href="/auth">Login</Link>
            </Button>
         ) : null}
      </div>
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
  const { isAuthenticated, logout } = useAuth(); // Get logout from useAuth

  const handleLinkClick = useCallback((href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if(e) e.preventDefault();
    if (onLinkClick) {
      onLinkClick();
    }
    router.push(href);
  }, [onLinkClick, router]);

  const handleLogout = async () => {
    if (onLinkClick) onLinkClick();
    await logout(); // Call logout from context
  };

  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const secondaryMenuItems = [
    { href: '/premium', label: 'Unlock Premium', icon: DollarSign }, // Assuming Gem was placeholder for premium/currency icon
    { href: '/premium-plans', label: 'Premium Plans', icon: DollarSign },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: typeof mainNavItems[0] | typeof secondaryMenuItems[0]) => {
    const commonLinkProps = {
      href: item.href,
      onClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => handleLinkClick(item.href, e),
    };

    const menuItemContent = (
       <Link {...commonLinkProps} className="flex items-center gap-2 w-full h-full p-2">
         <item.icon className={cn("transition-colors h-4 w-4", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
         <span className={cn("transition-colors text-sm text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
       </Link>
    );

    const buttonWrapper = (
      <SidebarMenuButton
        asChild
        isActive={pathname === item.href}
        className={cn(
          "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out",
          "text-neonText hover:text-white",
          "hover:border-secondary/50 hover:shadow-neon focus:shadow-neon-lg glow-border-inner",
           "p-0",
          pathname === item.href
            ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30"
            : "hover:bg-primary/10 hover:border-primary/30"
        )}
      >
        {menuItemContent}
      </SidebarMenuButton>
    );
    
    // For mobile, SheetClose should wrap the button that contains the Link
    // For desktop, no SheetClose is needed.
    return (
      <SidebarMenuItem key={item.href}>
        {isMobile ? <SheetClose asChild>{buttonWrapper}</SheetClose> : buttonWrapper}
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
        <SidebarMenu className="flex-grow space-y-1 overflow-y-auto">
           {/* Main Navigation Items */}
           {mainNavItems.map(renderMenuItem)}
           <SidebarSeparator className="my-2" />
           {/* Secondary/Utility Menu Items */}
           {secondaryMenuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
      {isAuthenticated && (
       <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenuButton
              variant="outline"
              className="w-full justify-start border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive/80 glow-border-inner"
              onClick={handleLogout} // Use the new handleLogout
            >
              <LogoutIcon className="mr-2 h-4 w-4" />
              Log Out
            </SidebarMenuButton>
        </SidebarFooter>
      )}
    </Fragment>
  );
};


// --- AppLayoutContent Component (Handles actual layout and redirection) ---
interface AppLayoutContentProps {
  children: React.ReactNode;
}
const AppLayoutContent: React.FC<AppLayoutContentProps> = ({ children }) => {
  const authState = useAuth();
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly();

  const authLoading = authState.isLoading;
  const appContextIsLoading = appContext.isLoading;


  useEffect(() => {
    if (!isClientMounted) return; // Wait for client mount

    console.log("AppLayoutContent useEffect: Path:", pathname, "AuthLoading:", authLoading, "AppContextLoading:", appContextIsLoading, "IsAuth:", authState.isAuthenticated, "Lists:", appContext.state.lists?.length);

    if (authLoading || appContextIsLoading) {
      console.log("AppLayoutContent: Still loading, skipping redirect logic.");
      return; // Wait until all loading is false
    }

    const lists = appContext.state.lists;
    const hasLists = Array.isArray(lists) && lists.length > 0;

    if (!authState.isAuthenticated) {
      // User is NOT authenticated
      if (pathname !== AUTH_ROUTE && pathname !== APP_ROOT_ROUTE) {
        console.log("AppLayoutContent: Unauthenticated user, not on AUTH or ROOT. Redirecting to AUTH_ROUTE.");
        router.replace(`${AUTH_ROUTE}?redirectedFrom=${pathname}`);
      } else if (pathname === APP_ROOT_ROUTE) {
        console.log("AppLayoutContent: Unauthenticated user on ROOT. Redirecting to AUTH_ROUTE.");
        router.replace(AUTH_ROUTE);
      }
      return; // Early exit for unauthenticated
    }

    // User IS authenticated
    // Sync user ID to app context if user object exists and differs from app context's userId
    // This is crucial for fetching user-specific lists
    if (authState.user && authState.user.id !== appContext.state.userId) {
      console.log("AppLayoutContent: Authenticated user, syncing user ID to app context:", authState.user.id);
      appContext.dispatch({ type: 'SET_USER_ID', payload: authState.user.id });
      // This dispatch will cause a re-render and re-run of this effect.
      // Data fetching for lists will be triggered in app-context.
      // Return here to wait for lists to load for the now-set user.
      return;
    }

    // Proceed with redirects for authenticated users
    if (pathname === AUTH_ROUTE || pathname === APP_ROOT_ROUTE) {
      const targetRoute = hasLists ? DEFAULT_AUTHENTICATED_ROUTE : CREATE_FIRST_LIST_ROUTE;
      console.log(`AppLayoutContent: Authenticated user on AUTH or ROOT. Redirecting to ${targetRoute}. HasLists: ${hasLists}`);
      router.replace(targetRoute);
    } else if (hasLists && pathname === CREATE_FIRST_LIST_ROUTE) {
      console.log("AppLayoutContent: Authenticated, has lists, on CREATE_FIRST_LIST_ROUTE. Redirecting to DEFAULT_AUTHENTICATED_ROUTE (/list).");
      router.replace(DEFAULT_AUTHENTICATED_ROUTE);
    } else if (!hasLists && pathname !== CREATE_FIRST_LIST_ROUTE && AUTHENTICATED_AREA_PATHS.some(p => pathname.startsWith(p))) {
      // If user is in an authenticated area other than create-first, but has no lists, send to create-first
      console.log("AppLayoutContent: Authenticated, no lists, in authenticated area but not CREATE_FIRST_LIST_ROUTE. Redirecting to CREATE_FIRST_LIST_ROUTE.");
      router.replace(CREATE_FIRST_LIST_ROUTE);
    } else {
      console.log("AppLayoutContent: Authenticated user, no redirect conditions met. Pathname:", pathname, "HasLists:", hasLists);
    }

  }, [
    isClientMounted,
    authLoading,
    appContextIsLoading,
    authState.isAuthenticated,
    authState.user, // Effect should re-run if user object changes (e.g., after login)
    appContext.state.lists,
    appContext.state.userId, // Effect should re-run if app context's userId changes
    pathname,
    router,
    appContext.dispatch // dispatch function reference is stable
  ]);


  // --- Loading State ---
  if (!isClientMounted || authLoading || appContext.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
      </div>
    );
  }

  // If on auth page, just render children (the auth page itself)
  if (pathname === AUTH_ROUTE) {
    return <>{children}</>;
  }
  
  // If not authenticated and trying to access other pages (should have been redirected by useEffect, but as a fallback)
  if (!authState.isAuthenticated) {
     return (
        <div className="flex items-center justify-center h-screen bg-background text-center p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }

  // --- Render full layout for authenticated users ---
  return (
     <Fragment>
       <MobileHeader />
        <Sidebar className="hidden md:flex md:flex-col">
         <MainMenuContent isMobile={false} />
        </Sidebar>
        <SidebarInset>
          <main className="flex-1 flex flex-col md:px-6 lg:px-8 xl:px-10 md:py-4 bg-background overflow-y-auto max-w-full">
             <div className="flex-grow pb-[calc(1rem+env(safe-area-inset-bottom))]"> {/* Padding for FAB */}
              {children}
            </div>
          </main>
        </SidebarInset>
       <Toaster />
     </Fragment>
  );
};


export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TooltipProvider delayDuration={0}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </TooltipProvider>
  );
};
