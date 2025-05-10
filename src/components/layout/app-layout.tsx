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
  Info,
  Mail,
  ShieldCheck as PolicyIcon, // Renamed for clarity
  FileText as ArticleIcon,   // Renamed for clarity
  Star,
  AppWindow as AppsIcon,
  Menu as MenuIcon,
  X,
  UserCircle2 as ProfileIcon,
  LogOut as LogoutIcon, // Alias for clarity
  Palette // For themes if re-added
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
import { useAppContext }  from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useClientOnly } from '@/hooks/use-client-only'; // Corrected hook import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Constants for Routes ---
const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isPremium?: boolean; // To mark premium features
  action?: () => void;
}

// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

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
        {isAuthenticated && user ? (
          <ProfileDropdown />
        ) : (
          <Button variant="ghost" size="icon" asChild>
            <Link href={AUTH_ROUTE} className="text-primary hover:text-primary/80">
              <ProfileIcon className="h-5 w-5" />
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
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
    // Interstitial ad logic can be triggered here if needed
  };

  const profileMenuItems: NavItem[] = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard, isPremium: true },
    { href: '/history', label: 'History', icon: History, isPremium: true },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette, isPremium: true }, // Example: Themes as premium
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
          <ProfileIcon className="h-5 w-5" />
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

// --- Main Menu Content ---
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
    if (onLinkClick) onLinkClick();
    router.push(href);
  }, [onLinkClick, router]);

  const handleLogout = async () => {
    if (onLinkClick) onLinkClick();
    await authLogout();
  };

  const mainDesktopNavItems: NavItem[] = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard, isPremium: true },
    { href: '/history', label: 'History', icon: History, isPremium: true },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette, isPremium: true },
  ];

  const secondaryMenuItems: NavItem[] = [
    { href: '/premium', label: 'Premium', icon: Star },
    { href: '/premium-plans', label: 'Plans', icon: Star }, // Example: reusing Star or specific icon
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
        "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out hover:text-white hover:border-secondary/50 hover:shadow-neon focus:shadow-neon-lg glow-border-inner p-0",
        pathname === item.href && !isItemPremiumLocked ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30" : "hover:bg-primary/10 hover:border-primary/30",
        isItemPremiumLocked && "cursor-not-allowed bg-muted/10 hover:bg-muted/20"
      ),
      disabled: isItemPremiumLocked,
    };

    const linkComponent = (
      <Link href={item.href} onClick={(e) => { if (isItemPremiumLocked) e.preventDefault(); else handleLinkClick(item.href, e); }} className="flex items-center gap-2 w-full h-full p-2">
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
    <Fragment>
      <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow flex flex-col">
        <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto">
          {/* Render main desktop nav items only for desktop view */}
          {!isMobile && mainDesktopNavItems.map(item => renderMenuItem(item))}
          {!isMobile && <SidebarSeparator className="my-2" />}
          {/* Secondary items are for both mobile (in sheet) and desktop */}
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
    </Fragment>
  );
};

// --- AppLayoutContent Component ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading: authIsLoading, isAuthenticated, user } = useAuth();
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly();

  const combinedIsLoading = authIsLoading || appIsLoading;

  useEffect(() => {
    if (!isClientMounted) {
        console.log("AppLayoutContent: Client not mounted, skipping redirect logic.");
        return;
    }

    // Wait for both authentication and app initial data to load before making redirect decisions
    if (combinedIsLoading) {
        console.log("AppLayoutContent: Auth or App data still loading, skipping redirect logic.", { authIsLoading, appIsLoading });
        return;
    }

    console.log("AppLayoutContent: Ready for redirect logic.", { isAuthenticated, listsLength: appState.lists?.length, userSpecificLists: appState.lists?.filter(l => l.userId === user?.id).length, pathname, userId: user?.id });

    if (isAuthenticated && user) {
        // Filter lists for the currently authenticated user
        const userLists = appState.lists ? appState.lists.filter(list => list.userId === user.id) : [];
        const hasUserLists = userLists.length > 0;

        console.log(`AppLayoutContent: Authenticated as user ${user.id}. Has lists: ${hasUserLists}. Pathname: ${pathname}`);

        if (!hasUserLists) { // No lists for this specific user
            if (pathname !== CREATE_FIRST_LIST_ROUTE && pathname !== AUTH_ROUTE) {
                console.log(`AppLayoutContent: Authenticated, No lists for user ${user.id}, not on create/auth. Redirect to ${CREATE_FIRST_LIST_ROUTE} from ${pathname}.`);
                router.replace(CREATE_FIRST_LIST_ROUTE);
            }
        } else { // User has lists
            if (pathname === CREATE_FIRST_LIST_ROUTE) {
                console.log(`AppLayoutContent: Authenticated, Has lists, on create-first. Redirect to ${DEFAULT_AUTHENTICATED_ROUTE}.`);
                router.replace(DEFAULT_AUTHENTICATED_ROUTE);
            } else if (pathname === AUTH_ROUTE) {
                console.log(`AppLayoutContent: Authenticated, Has lists, on auth. Redirect to ${DEFAULT_AUTHENTICATED_ROUTE}.`);
                router.replace(DEFAULT_AUTHENTICATED_ROUTE);
            }
        }
    } else { // Not authenticated
        if (pathname !== AUTH_ROUTE) {
            console.log(`AppLayoutContent: Not Authenticated, not on auth. Redirect to ${AUTH_ROUTE} from ${pathname}.`);
            router.replace(`${AUTH_ROUTE}?redirectedFrom=${pathname}`);
        }
    }
  }, [isClientMounted, combinedIsLoading, isAuthenticated, user, appState.lists, pathname, router, appIsLoading]); // Added appIsLoading, user

  if (!isClientMounted || combinedIsLoading) {
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

  if (!isAuthenticated) {
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
          <div className="flex-grow pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
