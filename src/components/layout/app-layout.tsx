// src/components/layout/app-layout.tsx
"use client";

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu as MenuIcon, // Renamed Menu to avoid conflict
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Palette,
  Info,
  Mail,
  ShieldCheck as PolicyIcon, // Alias for clarity
  FileText as ArticleIcon,  // Alias for clarity
  Star,
  AppWindow as AppsIcon,    // Corrected icon name
  X,
  LogOut as LogoutIcon // Alias for clarity
} from 'lucide-react';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useAppContext }
from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useClientOnly } from '@/hooks/use-client-only'; // Import the custom hook


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isPremium?: boolean; // Optional: for premium-only links
}

// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, isLoading: authIsLoading } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
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

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>
      <div className="w-10 h-10 flex items-center justify-center">
        {/* Placeholder for potential right-side actions if needed later */}
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
  const { isAuthenticated, logout, user } = useAuth();
  const { state: { isPremium } } = useAppContext();

  const handleLinkClick = useCallback((href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (e) e.preventDefault();
    if (onLinkClick) {
      onLinkClick();
    }
    router.push(href);
  }, [onLinkClick, router]);

  const handleLogout = async () => {
    if (onLinkClick) onLinkClick();
    await logout();
  };

  const mainNavItems: NavItem[] = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard, isPremium: true },
    { href: '/history', label: 'History', icon: History, isPremium: true },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const secondaryMenuItems: NavItem[] = [
    { href: '/premium', label: 'Unlock Premium', icon: Star }, // Changed Icon
    { href: '/premium-plans', label: 'Premium Plans', icon: Star }, // Changed Icon
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: NavItem) => {
    const isItemPremiumLocked = item.isPremium && !isPremium;

    const linkContent = (
        <>
            <item.icon className={cn("transition-colors h-4 w-4 shrink-0", pathname === item.href && !isItemPremiumLocked ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white", isItemPremiumLocked && "opacity-50")} />
            <span className={cn("transition-colors text-sm", pathname === item.href && !isItemPremiumLocked ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white", isItemPremiumLocked && "opacity-50")}>{item.label}</span>
            {isItemPremiumLocked && <Star className="ml-auto h-3 w-3 text-yellow-400" />}
        </>
    );
    
    const commonButtonProps = {
        asChild: true,
        isActive: pathname === item.href && !isItemPremiumLocked,
        className: cn(
          "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out",
          "hover:text-white",
          "hover:border-secondary/50 hover:shadow-neon focus:shadow-neon-lg glow-border-inner",
          "p-0",
          pathname === item.href && !isItemPremiumLocked
            ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30"
            : "hover:bg-primary/10 hover:border-primary/30",
          isItemPremiumLocked && "cursor-not-allowed bg-muted/10 hover:bg-muted/20"
        ),
        disabled: isItemPremiumLocked,
    };

    const linkComponent = (
        <Link href={item.href} onClick={(e) => { if (isItemPremiumLocked) e.preventDefault(); else handleLinkClick(item.href, e);}} className="flex items-center gap-2 w-full h-full p-2">
            {linkContent}
        </Link>
    );


    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton {...commonButtonProps}>
          {isMobile ? <SheetClose asChild>{linkComponent}</SheetClose> : linkComponent}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <React.Fragment>
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
      {isAuthenticated && (
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
      )}
    </React.Fragment>
  );
};

// --- AppLayoutContent Component (Handles actual layout and redirection) ---
const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';

const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuth();
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly(); // Use the custom hook

  const combinedIsLoading = authState.isLoading || appContext.isLoading;

  console.log("AppLayoutContent rendering. ClientMounted:", isClientMounted, "AuthLoading:", authState.isLoading, "AppContextLoading:", appContext.isLoading, "Pathname:", pathname, "IsAuth:", authState.isAuthenticated);


  useEffect(() => {
    if (!isClientMounted || authState.isLoading || appContext.isLoading) { // Added appContext.isLoading
        console.log("AppLayoutContent: Waiting for client mount or loading to complete.");
        return;
    }
    console.log("AppLayoutContent: useEffect for redirection running. AuthState:", authState.isAuthenticated, "Lists:", appContext.state.lists?.length, "Path:", pathname);


    if (!authState.isAuthenticated) {
      if (pathname !== AUTH_ROUTE) {
        console.log(`AppLayoutContent: Not authenticated, not on /auth. Redirecting to ${AUTH_ROUTE} from ${pathname}.`);
        router.replace(`${AUTH_ROUTE}?redirectedFrom=${pathname}`);
      }
      return;
    }

    // User IS authenticated
    if (pathname === AUTH_ROUTE) {
      console.log(`AppLayoutContent: Authenticated and on /auth. Redirecting to ${CREATE_FIRST_LIST_ROUTE}.`);
      router.replace(CREATE_FIRST_LIST_ROUTE);
    } else {
        const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
        if (!hasLists && pathname !== CREATE_FIRST_LIST_ROUTE) {
            console.log(`AppLayoutContent: Authenticated, no lists, not on create-first. Redirecting to ${CREATE_FIRST_LIST_ROUTE} from ${pathname}.`);
            router.replace(CREATE_FIRST_LIST_ROUTE);
        } else if (hasLists && pathname === CREATE_FIRST_LIST_ROUTE) {
            console.log(`AppLayoutContent: Authenticated, has lists, on create-first. Redirecting to ${DEFAULT_AUTHENTICATED_ROUTE}.`);
            router.replace(DEFAULT_AUTHENTICATED_ROUTE);
        }
    }
  }, [
    isClientMounted,
    authState.isLoading, // Keep this
    appContext.isLoading, // Add this
    authState.isAuthenticated,
    appContext.state.lists,
    pathname,
    router,
  ]);


  if (!isClientMounted || combinedIsLoading) {
    console.log("AppLayoutContent: Rendering global loading spinner.");
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
      </div>
    );
  }

  if (pathname === AUTH_ROUTE) {
    console.log("AppLayoutContent: Rendering AuthPage children.");
    return <>{children}</>;
  }

  if (!authState.isAuthenticated && pathname !== AUTH_ROUTE) {
      // This case should ideally be handled by the useEffect redirect,
      // but as a fallback, show a loader if not authenticated and not on auth page yet.
      console.log("AppLayoutContent: Fallback - Not authenticated and not on /auth, showing loader (should have redirected).");
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
      );
  }

  console.log("AppLayoutContent: Rendering full layout.");
  return (
    <Fragment>
      <MobileHeader />
      <Sidebar className="hidden md:flex md:flex-col">
        <MainMenuContent isMobile={false} />
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 flex flex-col md:px-6 lg:px-8 xl:px-10 md:py-4 bg-background overflow-y-auto max-w-full">
          <div className="flex-grow pb-[calc(4rem+env(safe-area-inset-bottom))]"> {/* Adjust padding for FAB */}
            {children}
          </div>
        </main>
      </SidebarInset>
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
