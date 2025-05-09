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
  SidebarSheetContent,
  SidebarSeparator
} from '@/components/ui/sidebar';

import {
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
  AppWindow as AppsIcon,
  Menu as MenuIcon,
  X,
  UserCircle2 as ProfileIcon,
  LogOut as LogoutIcon,
  Gem,
  DollarSign,
  Home // Added Home icon for the main list page
} from 'lucide-react';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/app-context'; // Corrected path
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from '../../context/auth-context'; // Corrected path
import { useClientOnly } from '../../hooks/use-client-only'; // Corrected path
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();

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

      <div className="w-10">
        {authIsLoading ? (
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted"></div>
        ) : isAuthenticated && user ? (
          <ProfileDropdown />
        ) : (
          <Button variant="ghost" size="icon" asChild className="text-primary hover:text-primary/80 hover:bg-primary/10">
             <Link href="/auth"><ProfileIcon className="h-6 w-6" /></Link>
          </Button>
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
    // Redirection is handled by the logout function in AuthContext
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
  const { isAuthenticated, logout } = useAuth();

  const handleLinkClick = useCallback((href: string) => {
    if (onLinkClick) {
      onLinkClick();
    }
    // No need for setTimeout if not using router.push directly, Link handles navigation
  }, [onLinkClick]);

  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: Home },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const secondaryMenuItems = [
    { href: '/premium', label: 'Unlock Premium', icon: Gem },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: typeof mainNavItems[0]) => {
    const menuItemContent = (
      <Link href={item.href} onClick={() => handleLinkClick(item.href)} className="flex items-center gap-2">
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
          <SidebarSeparator />
          {secondaryMenuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border shrink-0">
        {isAuthenticated ? (
           <Button
             variant="outline"
             className="w-full justify-center text-red-500 hover:text-red-400 hover:bg-destructive/20 border-destructive/50 glow-border-inner"
             onClick={async () => {
               if (onLinkClick) onLinkClick();
               await logout();
             }}
           >
             <LogoutIcon className="mr-2 h-4 w-4" /> Logout
           </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-center text-primary hover:text-primary/80 hover:bg-primary/10 border-primary/50 glow-border-inner"
            onClick={() => {
                if (onLinkClick) onLinkClick();
                router.push('/auth');
            }}
           >
            Login / Sign Up
           </Button>
        )}
      </SidebarFooter>
    </Fragment>
  );
};


// --- Main AppLayoutContent Component ---
interface AppLayoutContentProps {
  children: React.ReactNode;
}

const AppLayoutContent: React.FC<AppLayoutContentProps> = ({ children }) => {
  const appContext = useAppContext();
  const authState = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly();

  const { isLoading: authLoading, isAuthenticated } = authState;
  const { isLoading: appLoading } = appContext;
  const isLoading = authLoading || appLoading;

  useEffect(() => {
    if (isClientMounted && !isLoading) { // Ensure client is mounted and not loading
      const userHasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;

      if (isAuthenticated) {
        if (pathname === '/auth') { // If authenticated and on auth page
          router.replace(userHasLists ? '/list' : '/list/create-first');
        } else if (!userHasLists && pathname !== '/list/create-first') { // If no lists and not on create page
          router.replace('/list/create-first');
        } else if (userHasLists && pathname === '/list/create-first') { // If has lists and on create page
          router.replace('/list');
        }
      } else {
        // If not authenticated and not on /auth page (and not an internal Next.js path)
        if (pathname !== '/auth' && !pathname.startsWith('/_next/')) {
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
  
  // If on auth page and not authenticated, render only children (auth page)
  if (pathname === '/auth' && !isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and trying to access other pages, loader will show while useEffect redirects
  if (!isAuthenticated && pathname !== '/auth') {
      return (
          <div className="flex items-center justify-center fixed inset-0 bg-background/90 z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
      );
  }

  // Render full layout for authenticated users or if on a public page not /auth
  return (
    <Fragment>
      <MobileHeader />
      <Sidebar className="hidden md:flex md:flex-col">
        <MainMenuContent />
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 flex flex-col md:px-6 lg:px-8 xl:px-10 md:py-4 bg-background overflow-y-auto max-w-full">
          {children}
        </main>
      </SidebarInset>
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
