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
  AppWindow as AppsIcon, // Corrected: Use AppWindow for AppsIcon
  Menu as MenuIcon, // Keep Menu as Menu
  X,
  Palette, // For Themes
  LogOut as LogoutIcon, // Renamed LogOut
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
  // Removed SidebarProvider import as it's now in layout.tsx
  // Removed useSidebar import as it's no longer used
  Sidebar, // Main Sidebar component
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
import { useAppContext } from '@/context/app-context';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip"; // Added TooltipProvider
import { useClientOnly } from '@/hooks/use-client-only'; // Import the custom hook


// --- Constants for Routes ---
const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth(); // Added logout

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger asChild>
           <Button variant="ghost" size="icon" /* onClick removed, Sheet handles it */ className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
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

      {/* Centered App Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>

      {/* Right side: Placeholder for potential icons or actions if needed, ensures title stays centered */}
      <div className="w-10 h-10">
        {/* This div acts as a spacer. If you add icons here, ensure they balance the hamburger menu */}
      </div>
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
  const { isAuthenticated, logout } = useAuth(); // Correctly using logout from useAuth
  const { state: { isPremium } } = useAppContext();

  const handleLinkClick = useCallback((href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (e) e.preventDefault(); // Prevent default only if event is passed
    if (onLinkClick) onLinkClick();
    router.push(href);
  }, [onLinkClick, router]);

  const handleLogout = async () => {
    if (onLinkClick) onLinkClick();
    await logout(); // Call logout from AuthContext
  };

  // Define navigation items
  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard, isPremium: true },
    { href: '/history', label: 'History', icon: History, isPremium: true },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette, isPremium: true },
  ];

  const secondaryMenuItems = [
    { href: '/premium', label: 'Unlock Premium', icon: Star },
    { href: '/premium-plans', label: 'Premium Plans', icon: Star },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];


  const renderMenuItem = (item: typeof mainNavItems[0] | typeof secondaryMenuItems[0]) => {
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

    // For mobile, wrap the link component in SheetClose
    const interactiveElement = isMobile ? <SheetClose asChild>{linkComponent}</SheetClose> : linkComponent;

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton {...commonButtonProps}>
          {interactiveElement}
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
          {mainNavItems.map(item => renderMenuItem(item))}
          <SidebarSeparator className="my-2" />
          {secondaryMenuItems.map(item => renderMenuItem(item))}
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


// --- AppLayoutContent: Handles loading states and conditional rendering ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useAuth();
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly();

  const { isAuthenticated, isLoading: authIsLoading, user } = authContext;
  const { state: appState, isLoading: appIsLoading } = appContext;

  const combinedIsLoading = authIsLoading || appIsLoading;

  useEffect(() => {
    if (!isClientMounted || combinedIsLoading) {
      return; // Wait for client mount and data loading
    }
    
    const userSpecificLists = appState.lists ? appState.lists.filter(list => list.userId === user?.id) : [];
    const hasUserLists = userSpecificLists.length > 0;

    console.log("AppLayoutContent Check:", { isAuthenticated, pathname, hasUserLists, combinedIsLoading });


    if (!isAuthenticated) {
      if (pathname !== AUTH_ROUTE) {
        console.log("AppLayoutContent: Not Authenticated. Redirecting to AUTH_ROUTE from:", pathname);
        router.replace(AUTH_ROUTE);
      }
    } else { // Authenticated
      if (pathname === AUTH_ROUTE) {
        console.log("AppLayoutContent: Authenticated, on AUTH_ROUTE. Redirecting.");
        router.replace(hasUserLists ? DEFAULT_AUTHENTICATED_ROUTE : CREATE_FIRST_LIST_ROUTE);
      } else if (!hasUserLists) {
        if (pathname !== CREATE_FIRST_LIST_ROUTE) {
          console.log("AppLayoutContent: Authenticated, No lists. Redirecting to CREATE_FIRST_LIST_ROUTE from:", pathname);
          router.replace(CREATE_FIRST_LIST_ROUTE);
        }
      } else { // Authenticated and has lists
        if (pathname === CREATE_FIRST_LIST_ROUTE) {
          console.log("AppLayoutContent: Authenticated, Has lists, on CREATE_FIRST_LIST_ROUTE. Redirecting to DEFAULT_AUTHENTICATED_ROUTE.");
          router.replace(DEFAULT_AUTHENTICATED_ROUTE);
        }
      }
    }
  }, [isClientMounted, combinedIsLoading, isAuthenticated, user, appState.lists, pathname, router, appState.userId]);


  if (!isClientMounted || combinedIsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-primary text-sm font-medium">Loading App...</p>
      </div>
    );
  }
  
  // If on auth page and not authenticated (or auth still loading), render auth page
  if (pathname === AUTH_ROUTE && !isAuthenticated) {
    return <>{children}</>;
  }

  // If authenticated, but no lists, and not on create-first page, render create-first or loader
  if (isAuthenticated && appState.lists.filter(list => list.userId === user?.id).length === 0 && pathname !== CREATE_FIRST_LIST_ROUTE) {
     // This state should ideally be handled by the useEffect redirect.
     // If reached, it means user is auth'd, has no lists, but isn't on create-first.
     // Could show specific "Create a list" prompt or a loader if redirect is pending.
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
        <p className="text-muted-foreground">Redirecting to list creation...</p>
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
           <div className="flex-grow pb-[calc(1rem+env(safe-area-inset-bottom))]"> {/* Reduced bottom padding for list page fab */}
             {children}
           </div>
         </main>
       </SidebarInset>
       {/* AdInitializer can be placed here if it's a global banner */}
       {/* <AdInitializer /> */}
     </Fragment>
   );
}


// --- Main AppLayout component with TooltipProvider ---
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TooltipProvider delayDuration={0}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </TooltipProvider>
  );
};
