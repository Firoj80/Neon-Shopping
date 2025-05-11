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
  ShieldCheck as Policy, // Renamed ShieldCheck to Policy
  FileText as Article, // Renamed FileText to Article
  Star,
  AppWindow as AppsIcon, // Corrected AppsIcon to AppWindow
  X,
  DollarSign, // Added for Currency
  Palette, // Added for Themes
  LogOut, // Added for Logout
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip"; // Added TooltipProvider
// Removed AuthProvider and useAuth imports as they are not used directly here
// import { useClientOnly } from '@/hooks/use-client-only'; // Import the custom hook - No longer needed as AppLayoutContent is a client component

// --- Mobile Header Component ---
const MobileHeader: React.FC<{ onMenuToggle: () => void; isMenuOpen: boolean }> = ({ onMenuToggle, isMenuOpen }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <SheetTrigger asChild> {/* Wrap the Button with SheetTrigger */}
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

      {/* Right Side: Placeholder for potential icons like profile/notifications */}
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
  const { state: appState, dispatch: appDispatch } = useAppContext(); // For anonymous user handling
  // const { logout, isAuthenticated } = useAuth(); // Auth context removed

  const handleLinkClick = useCallback((href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (e) e.preventDefault();
    if (onLinkClick) onLinkClick();
    router.push(href);
  }, [onLinkClick, router]);

  // const handleLogout = async () => { // Logout logic removed as auth is simplified
  //   // await logout();
  //   appDispatch({ type: 'SET_USER_ID', payload: null }); // Clear app context user ID
  //   appDispatch({ type: 'RESET_STATE_FOR_ANONYMOUS' }); // Reset to anonymous state
  //   if (onLinkClick) onLinkClick();
  //   router.push('/auth'); // Redirect to auth page after logout
  // };

  // Main navigation items for the sidebar
  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette }, // Added Themes
  ];

  const secondaryMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy },
    { href: '/terms', label: 'Terms of Service', icon: Article },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
    // { href: '/premium', label: 'Unlock Premium', icon: Gem }, // Premium link removed
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
    
    const interactiveElement = isMobile ? (
        <SheetClose asChild>
             <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)} className="flex items-center gap-2 w-full h-full p-2">
                {linkContent}
            </Link>
        </SheetClose>
    ) : (
        <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)} className="flex items-center gap-2 w-full h-full p-2">
            {linkContent}
        </Link>
    );

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
      <SidebarFooter className="p-2 border-t border-sidebar-border">
        {/* Logout button removed as auth is simplified */}
      </SidebarFooter>
    </Fragment>
  );
};


const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  // const { isAuthenticated, isLoading: authLoading, user } = useAuth(); // Auth logic simplified
  const isClientMounted = useAppContext().state.isInitialDataLoaded; // Rely on app context's loaded state
  const isLoading = appContext.isLoading; // Simplified loading state

  const [isSheetOpen, setIsSheetOpen] = useState(false);


  useEffect(() => {
    if (isClientMounted && !isLoading) {
      const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
      // const isUserOnAuthPage = pathname === '/auth'; // Auth page logic removed
      const isUserOnCreateFirstPage = pathname === '/list/create-first';

      // Simplified: If no lists and not on create page, redirect to create.
      if (!hasLists && !isUserOnCreateFirstPage ) {
         console.log("AppLayoutContent: No lists, redirecting to create-first.");
         router.replace('/list/create-first');
      } else if (hasLists && isUserOnCreateFirstPage) {
         console.log("AppLayoutContent: Has lists, on create-first. Redirecting to /list.");
         router.replace('/list');
      }
    }
  }, [isClientMounted, isLoading, appContext.state.lists, pathname, router]);


  if (isLoading || !isClientMounted) { // Show loader until client is mounted and initial data is loaded
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
      </div>
    );
  }

  // Auth page rendering logic removed

  return (
     <Fragment>
       {/* Mobile Header */}
       <MobileHeader onMenuToggle={() => setIsSheetOpen(prev => !prev)} isMenuOpen={isSheetOpen} />

       {/* Mobile Sidebar (Sheet) */}
       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SidebarSheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
          <MainMenuContent onLinkClick={() => setIsSheetOpen(false)} isMobile={true} />
        </SidebarSheetContent>
      </Sheet>

       {/* Desktop Sidebar */}
       <Sidebar className="hidden md:flex md:flex-col">
        <MainMenuContent isMobile={false} />
      </Sidebar>

       <SidebarInset>
        <main className="flex-1 flex flex-col md:px-6 lg:px-8 xl:px-10 md:py-4 bg-background overflow-y-auto max-w-full">
          {/* The main content area now has padding-bottom handled in RootLayout for the ad banner */}
          <div className="flex-grow">
            {children}
          </div>
        </main>
      </SidebarInset>
     </Fragment>
   );
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TooltipProvider delayDuration={0}>
      {/* AuthProvider removed from here, it's higher in RootLayout if needed, or removed if auth simplified */}
      <AppLayoutContent>{children}</AppLayoutContent>
    </TooltipProvider>
  );
};
