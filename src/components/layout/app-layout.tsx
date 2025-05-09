// src/components/layout/app-layout.tsx
"use client";

import React, { useState, useEffect, Fragment, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose, // Added SheetClose
} from "@/components/ui/sheet";
import {
  // Removed SidebarProvider import as it's no longer used
  // Removed useSidebar import as it's no longer used
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
  ShieldCheck as Policy, // Renamed ShieldCheck to Policy
  FileText as Article, // Renamed FileText to Article
  Star,
  AppWindow as AppsIcon, // Corrected AppsIcon to AppWindow
  X,
  DollarSign, // Added for Currency
  Palette, // For Themes
  Gem, // For Premium
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip"; // Added TooltipProvider
import { useAuth } from '@/context/auth-context'; // Import useAuth
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut as LogoutIcon, UserCircle2 as ProfileIcon } from 'lucide-react'; // Moved from main list
import { Toaster } from "@/components/ui/toaster";
import { useClientOnly } from '@/hooks/use-client-only';


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

      {/* Center: App Name/Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
         <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
           <ShoppingCart className="w-6 h-6" />
           <ClientOnly><span>Neon Shopping</span></ClientOnly>
         </Link>
       </div>


       {/* Right Side: Profile Icon/Login Status */}
       <div className="w-10 h-10 flex items-center justify-center"> {/* Ensure consistent size */}
         {authIsLoading ? (
           <div className="h-6 w-6 animate-pulse rounded-full bg-muted"></div>
         ) : isAuthenticated && user ? (
           <ProfileDropdown />
         ) : (
           <div className="h-6 w-6"></div> // Placeholder for consistent layout
         )}
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
  const { logout } = useAuth();

  const handleLinkClick = useCallback((href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if(e) e.preventDefault();
    if (onLinkClick) {
      onLinkClick(); // Close sheet on mobile
    }
    router.push(href);
  }, [onLinkClick, router]);

  const handleLogout = async () => {
    if (onLinkClick) onLinkClick(); // Close sheet if on mobile
    await logout();
    // router.push('/auth') is handled by logout function or middleware
  };


  // Main navigation items previously in profile dropdown
  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const secondaryMenuItems = [
    { href: '/premium', label: 'Unlock Premium', icon: Gem },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy },
    { href: '/terms', label: 'Terms of Service', icon: Article },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: typeof mainNavItems[0] | typeof secondaryMenuItems[0]) => {
    const commonLinkProps = {
      href: item.href,
      onClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => handleLinkClick(item.href, e),
      className: "flex items-center gap-2 w-full h-full"
    };
    const menuItemContent = (
       <Link {...commonLinkProps}>
         <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
         <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
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
          pathname === item.href
            ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30"
            : "hover:bg-primary/10 hover:border-primary/30"
        )}
      >
        {menuItemContent}
      </SidebarMenuButton>
    );
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
        <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto">
          {mainNavItems.map(renderMenuItem)}
          <SidebarSeparator className="my-2" />
          {secondaryMenuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenuButton
              variant="outline"
              className="w-full justify-start border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive/80 glow-border-inner"
              onClick={handleLogout}
            >
              <LogoutIcon className="mr-2 h-4 w-4" />
              Log Out
            </SidebarMenuButton>
        </SidebarFooter>
    </Fragment>
  );
};


// --- Profile Dropdown Component ---
const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth(); // Removed isAuthenticated as it's implied if user exists
  const router = useRouter(); // Using Next.js router

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null; // Should not happen if used correctly, but a safeguard

  // Profile dropdown items are now in MainMenuContent for sidebar consistency
  // This dropdown can be simplified or repurposed if needed, or removed entirely
  // For now, let's keep it very simple, showing user info and logout

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full text-primary hover:text-primary/80 hover:bg-primary/10">
          <ProfileIcon className="h-6 w-6" />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-primary/30 shadow-neon glow-border-inner">
        <DropdownMenuLabel className="font-normal text-neonText">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        {/* Menu items previously here are now in MainMenuContent */}
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:bg-destructive/20 hover:text-red-400 focus:bg-destructive/30 glow-border-inner flex items-center gap-2">
          <LogoutIcon className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

  const isLoading = authState.isLoading || appContext.isLoading || !isClientMounted;

   // --- Redirect Logic ---
   // Redirect after ensuring client-side and loading is complete
   useEffect(() => {
     if (isClientMounted && !isLoading) { // Ensure not loading and client mounted
       const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;

       if (!authState.isAuthenticated) {
         // If not authenticated and not on auth page or create-first page, redirect to auth
         if (pathname !== AUTH_ROUTE && pathname !== CREATE_FIRST_LIST_ROUTE) {
           console.log(`AppLayoutContent: Unauthenticated. Current path: ${pathname}. Redirecting to ${AUTH_ROUTE}.`);
           router.replace(`${AUTH_ROUTE}?redirectedFrom=${pathname}`);
         }
       } else {
         // Authenticated
         if (pathname === AUTH_ROUTE) {
           // Authenticated user on auth page, redirect to create-first or list
           const redirectTo = hasLists ? '/list' : CREATE_FIRST_LIST_ROUTE;
           console.log(`AppLayoutContent: Authenticated on ${AUTH_ROUTE}. Redirecting to ${redirectTo}.`);
           router.replace(redirectTo);
         } else if (!hasLists && pathname !== CREATE_FIRST_LIST_ROUTE) {
           // Authenticated, no lists, and not on create-first page -> redirect to create-first
           // This allows access to other pages like /settings if needed, but guides to create list first
           // If you want to strictly force list creation before anything else, remove this condition
           if (['/list', '/stats', '/history'].includes(pathname)) { // Only redirect for list-dependent pages
                console.log(`AppLayoutContent: Authenticated, no lists. Current path: ${pathname}. Redirecting to ${CREATE_FIRST_LIST_ROUTE}.`);
                router.replace(CREATE_FIRST_LIST_ROUTE);
           }
         } else if (hasLists && pathname === CREATE_FIRST_LIST_ROUTE) {
           // Authenticated, has lists, but on create-first page -> redirect to /list
           console.log(`AppLayoutContent: Authenticated, has lists, on create-first. Redirecting to /list.`);
           router.replace('/list');
         }
       }
     }
   }, [isClientMounted, isLoading, authState.isAuthenticated, appContext.state.lists, pathname, router]);


  if (isLoading) {
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

  // If unauthenticated and not on auth page, useEffect should handle redirect.
  // This is a fallback before redirect, or if on CREATE_FIRST_LIST_ROUTE unauthenticated.
  if (!authState.isAuthenticated && pathname !== CREATE_FIRST_LIST_ROUTE) {
     return (
        <div className="flex items-center justify-center h-screen bg-background text-center p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }

  // --- Render full layout ---
  return (
     <Fragment>
       {/* Mobile Header */}
       <MobileHeader />

        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex md:flex-col">
         <MainMenuContent isMobile={false} />
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset>
          <main className="flex-1 flex flex-col md:px-6 lg:px-8 xl:px-10 md:py-4 bg-background overflow-y-auto max-w-full">
             <div className="flex-grow pb-[calc(1rem+env(safe-area-inset-bottom))]"> {/* Adjusted padding-bottom */}
              {children}
            </div>
          </main>
        </SidebarInset>
       <Toaster />
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
