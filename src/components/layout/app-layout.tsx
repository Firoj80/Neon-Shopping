// src/components/layout/app-layout.tsx
"use client";
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Menu as MenuIcon, // Renamed Menu to avoid conflict
  X,
  LogOut as LogoutIcon, // Alias for clarity
  DollarSign,
  UserCircle2
} from 'lucide-react';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader as UISheetHeader, // Alias to avoid conflict
  SheetTitle as UISheetTitle // Alias to avoid conflict
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
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useClientOnly } from '@/hooks/use-client-only';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isPremium?: boolean;
  action?: () => void; // For handling actions like logout
}

// --- Constants for Routes ---
const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

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

      {/* Right Side: Profile Icon / Login Button */}
      <div className="w-10 h-10 flex items-center justify-center">
        {/* Placeholder for Profile Icon or Login Button */}
        {isAuthenticated && user ? (
          <ProfileDropdown />
        ) : (
          <Button variant="ghost" size="icon" asChild>
            <Link href={AUTH_ROUTE} className="text-primary hover:text-primary/80">
              <UserCircle2 className="h-5 w-5" />
              <span className="sr-only">Login</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
};


// --- Profile Dropdown Component ---
const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter(); // For navigation

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const profileMenuItems: NavItem[] = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard, isPremium: true },
    { href: '/history', label: 'History', icon: History, isPremium: true },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
          <UserCircle2 className="h-5 w-5" />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-secondary/50 shadow-neon glow-border-inner">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-neonText">{user?.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        {profileMenuItems.map((item) => (
          <DropdownMenuItem key={item.href} onClick={() => handleNavigation(item.href)} className="text-neonText/90 hover:bg-primary/10 focus:bg-primary/20 cursor-pointer">
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.label}</span>
            {item.isPremium && <Star className="ml-auto h-3 w-3 text-yellow-400" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem onClick={logout} className="text-red-500 hover:bg-destructive/20 focus:bg-destructive/30 cursor-pointer">
          <LogoutIcon className="mr-2 h-4 w-4" />
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
  const { isAuthenticated, logout: authLogout, user } = useAuth();
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
    await authLogout();
  };

  // Main navigation items - Now primarily for Desktop Sidebar, as mobile uses Profile Dropdown for these
   const mainDesktopNavItems: NavItem[] = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard, isPremium: true },
    { href: '/history', label: 'History', icon: History, isPremium: true },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const secondaryMenuItems: NavItem[] = [
    { href: '/premium', label: 'Unlock Premium', icon: Star },
    { href: '/premium-plans', label: 'Premium Plans', icon: DollarSign },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: NavItem, isDesktopMainItem: boolean = false) => {
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
          "p-0", // Remove padding from button itself, Link will handle it
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
          {isMobile && isDesktopMainItem ? null : (isMobile ? <SheetClose asChild>{linkComponent}</SheetClose> : linkComponent)}
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
          {/* For mobile, main app navigation is in profile dropdown. For desktop, it's here. */}
          {!isMobile && mainDesktopNavItems.map(item => renderMenuItem(item, true))}
          {!isMobile && <SidebarSeparator className="my-2" />}
          {secondaryMenuItems.map(item => renderMenuItem(item))}
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
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuth();
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly();

  const isLoading = authState.isLoading || appContext.isLoading;

  console.log("AppLayoutContent: ClientMounted:", isClientMounted, "isLoading:", isLoading, "Auth:", authState.isAuthenticated, "Lists:", appContext.state.lists?.length, "Path:", pathname);

  useEffect(() => {
    if (isClientMounted && !isLoading) {
      if (authState.isAuthenticated) {
        const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
        if (!hasLists && pathname !== CREATE_FIRST_LIST_ROUTE && pathname !== AUTH_ROUTE) {
          console.log(`AppLayoutContent: Auth, No lists, not create/auth. Redirect to ${CREATE_FIRST_LIST_ROUTE} from ${pathname}.`);
          router.replace(CREATE_FIRST_LIST_ROUTE);
        } else if (hasLists && pathname === CREATE_FIRST_LIST_ROUTE) {
          console.log(`AppLayoutContent: Auth, Has lists, on create. Redirect to ${DEFAULT_AUTHENTICATED_ROUTE}.`);
          router.replace(DEFAULT_AUTHENTICATED_ROUTE);
        } else if (pathname === AUTH_ROUTE) {
            console.log(`AppLayoutContent: Auth, on /auth. Redirect to ${hasLists ? DEFAULT_AUTHENTICATED_ROUTE : CREATE_FIRST_LIST_ROUTE}.`);
            router.replace(hasLists ? DEFAULT_AUTHENTICATED_ROUTE : CREATE_FIRST_LIST_ROUTE);
        }
      } else if (pathname !== AUTH_ROUTE) {
        console.log(`AppLayoutContent: Not Auth, not on /auth. Redirect to ${AUTH_ROUTE} from ${pathname}.`);
        router.replace(`${AUTH_ROUTE}?redirectedFrom=${pathname}`);
      }
    }
  }, [isClientMounted, isLoading, authState.isAuthenticated, appContext.state.lists, pathname, router, appContext.state.lists?.length]);


  if (!isClientMounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
      </div>
    );
  }

  if (pathname === AUTH_ROUTE) {
    return <>{children}</>;
  }

  // Fallback if not authenticated and not on auth page (should be caught by useEffect)
  if (!authState.isAuthenticated) {
     return (
          <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
      );
  }


  return (
    <Fragment>
      <MobileHeader />
      <Sidebar className="hidden md:flex md:flex-col">
        <MainMenuContent isMobile={false} />
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 flex flex-col md:px-6 lg:px-8 xl:px-10 md:py-4 bg-background overflow-y-auto max-w-full">
           <div className="flex-grow pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]"> {/* Adjust padding for FAB */}
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