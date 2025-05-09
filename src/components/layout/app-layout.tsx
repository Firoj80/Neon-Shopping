// src/components/layout/app-layout.tsx
"use client";

import React, { useState, useEffect, Fragment, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
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
  // SidebarSheetContent - Using SheetContent directly from ui/sheet
} from '@/components/ui/sidebar';

import {
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Palette,
  Info,
  Mail,
  ShieldCheck as PolicyIcon,
  FileText as ArticleIcon,
  Star,
  AppWindow as AppsIcon,
  Menu as MenuIcon,
  X,
  UserCircle2 as ProfileIcon,
  LogOut as LogoutIcon,
  Gem,
  Home
} from 'lucide-react';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from '@/context/auth-context';
import { useClientOnly } from '@/hooks/use-client-only';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/toaster";


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10">
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
        <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
          <MainMenuContent onLinkClick={() => setIsOpen(false)} isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>

      <div className="w-10"> {/* Ensure this div has a width to prevent layout shift */}
        {authIsLoading ? (
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted"></div>
        ) : isAuthenticated && user ? (
          <ProfileDropdown />
        ) : (
          <div className="h-6 w-6"></div> // Placeholder if no user and not loading
        )}
      </div>
    </header>
  );
};

// --- Profile Dropdown Component ---
const ProfileDropdown: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  const profileMenuItems = [
    { href: '/list', label: 'Shopping List', icon: Home },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
    { href: '/premium', label: 'Premium', icon: Gem },
  ];

  if (!isAuthenticated || !user) return null;

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
        {profileMenuItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/20 glow-border-inner">
            <Link href={item.href} className="flex items-center gap-2 text-neonText hover:text-primary">
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:bg-destructive/20 hover:text-red-400 focus:bg-destructive/30 glow-border-inner flex items-center gap-2">
          <LogoutIcon className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

  const handleLinkClick = useCallback((href: string, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault(); // Prevent default link behavior
    if (onLinkClick) {
      onLinkClick(); // Close sheet on mobile
    }
    router.push(href); // Navigate using Next.js router
  }, [onLinkClick, router]);


  const secondaryMenuItems = [
    // { href: '/premium', label: 'Unlock Premium', icon: Gem }, // Moved to profile dropdown
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: typeof secondaryMenuItems[0]) => {
    const menuItemContent = (
      <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)} className="flex items-center gap-2 w-full h-full">
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
        {/* The Link component itself becomes the child of SidebarMenuButton */}
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
          {secondaryMenuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
      {/* Footer is now part of ProfileDropdown or handled differently */}
    </Fragment>
  );
};


// --- AppLayoutContent Component (Handles actual layout and redirection) ---
interface AppLayoutContentProps {
  children: React.ReactNode;
}
const AppLayoutContent: React.FC<AppLayoutContentProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly();

  // Combined loading state
  const pageIsLoading = !isClientMounted || authIsLoading || (isAuthenticated && appIsLoading);

  useEffect(() => {
    console.log("AppLayoutContent useEffect: Mounted:", isClientMounted, "AuthLoading:", authIsLoading, "IsAuth:", isAuthenticated, "AppLoading:", appIsLoading, "Path:", pathname);
    if (!isClientMounted || authIsLoading) {
      // Still critical loading in progress, defer redirection logic
      console.log("AppLayoutContent: Deferring redirect, critical loading in progress.");
      return;
    }

    // Auth is resolved now
    if (!isAuthenticated) {
      if (pathname !== '/auth') {
        console.log(`AppLayoutContent: Not authenticated. Current path: ${pathname}. Redirecting to /auth.`);
        router.replace('/auth');
      }
    } else {
      // Authenticated
      if (appIsLoading) {
        console.log("AppLayoutContent: Authenticated, but app data is loading.");
        // App data still loading for authenticated user
        return;
      }

      // Authenticated and App data loaded
      const userLists = appState.lists.filter(list => list.userId === user?.id);
      const hasLists = userLists.length > 0;

      if (pathname === '/auth') {
        console.log(`AppLayoutContent: Authenticated and on /auth. Redirecting to ${hasLists ? '/list' : '/list/create-first'}.`);
        router.replace(hasLists ? '/list' : '/list/create-first');
      } else if (!hasLists && pathname !== '/list/create-first') {
        // Allow access to other non-list pages like /settings, /themes, /premium, etc.
        // Only redirect to create-first if trying to access a page that *requires* lists (like /list itself, /stats, /history)
        const listDependentPages = ['/list', '/stats', '/history'];
        if (listDependentPages.includes(pathname)){
            console.log(`AppLayoutContent: Authenticated, no lists. Current path: ${pathname}. Redirecting to /list/create-first.`);
            router.replace('/list/create-first');
        }
      } else if (hasLists && pathname === '/list/create-first') {
        console.log(`AppLayoutContent: Authenticated, has lists, on create-first. Redirecting to /list.`);
        router.replace('/list');
      }
    }
  }, [isClientMounted, authIsLoading, isAuthenticated, appIsLoading, appState.lists, user, pathname, router]);

  if (pageIsLoading) {
    console.log(`AppLayoutContent: Showing global loader. isClientMounted: ${isClientMounted}, authIsLoading: ${authIsLoading}, isAuthenticated: ${isAuthenticated}, appIsLoading: ${appIsLoading && isAuthenticated}`);
    return (
      <div className="flex items-center justify-center h-screen bg-background text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
      </div>
    );
  }

  if (pathname === '/auth') {
    return <>{children}</>; // Render AuthPage
  }
  
  // If not authenticated and not on /auth, the useEffect should have redirected.
  // This is a fallback / interim state before redirect.
  if (!isAuthenticated) {
    console.log("AppLayoutContent: Rendering loader, waiting for redirect to /auth.");
     return (
      <div className="flex items-center justify-center h-screen bg-background text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
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
          {/* Ad Banner Area Placeholder - remove if not using AdMob */}
          {/* <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-card/80 backdrop-blur-sm border-t border-border/20 z-40 flex items-center justify-center text-xs text-muted-foreground glow-border-inner">
            Ad Banner Placeholder
          </div> */}
          {/* Adjust main content padding if banner is present */}
          <div className="flex-grow pb-[10px]"> {/* Reduced padding-bottom if no banner */}
            {children}
          </div>
        </main>
      </SidebarInset>
      <Toaster />
    </Fragment>
  );
};

// --- Main AppLayout Component (Wrapper) ---
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TooltipProvider delayDuration={0}>
        <AppLayoutContent>{children}</AppLayoutContent>
    </TooltipProvider>
  );
};
