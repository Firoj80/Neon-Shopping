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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Menu as MenuIcon,
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Info,
  Mail,
  ShieldCheck as PolicyIcon,
  FileText as ArticleIcon,
  Star,
  AppWindow as AppsIcon,
  Palette, 
  X,
  LogOut
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useClientOnly } from '@/hooks/use-client-only';
// Removed AuthProvider and useAuth imports as authentication is simplified


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

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
         <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
            <MainMenuContent onLinkClick={() => setIsOpen(false)} isMobile={true} />
        </SheetContent>
      </Sheet>
      
      {/* Centered App Name/Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>

      {/* Right Side: Placeholder for potential future icons */}
      <div className="w-10 h-10"></div>
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
  const appContext = useAppContext();
  // const { logout, isAuthenticated } = useAuth(); // Simplified: removed direct useAuth here

  const handleLogout = async () => {
    // For local storage based auth, just clear the relevant items and redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_user_id_vLocal_anon_v4'); // Or your actual auth token key
      localStorage.removeItem('neonShoppingState_vLocal_anon_v4'); // Clear app state too
    }
    // Dispatch actions to reset context states if necessary
    appContext.dispatch({ type: 'SET_USER_ID', payload: null }); // Reset AppContext's user
    // No need for API call to logout in local-only version
    if (onLinkClick) onLinkClick();
    router.push('/auth'); // Redirect to auth page after logout
  };
  
  const handleLinkClick = useCallback(async (href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (e) e.preventDefault(); 
    if (onLinkClick) onLinkClick();
    router.push(href);
  }, [onLinkClick, router]);


  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    // { href: '/themes', label: 'Themes', icon: Palette }, // Themes option removed
  ];

  const secondaryMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
    // { href: '/premium', label: 'Unlock Premium', icon: Gem }, // Premium option removed
  ];


  const renderMenuItem = (item: typeof mainNavItems[0] | typeof secondaryMenuItems[0]) => {
    const linkContent = (
      <>
        <item.icon className={cn(
            "transition-colors h-4 w-4 shrink-0", 
            pathname === item.href 
                ? "text-primary" 
                : "text-sidebar-foreground group-hover/menu-item:text-foreground" 
        )} />
        <span className={cn(
            "transition-colors text-sm", 
            pathname === item.href 
                ? "text-primary" 
                : "text-sidebar-foreground group-hover/menu-item:text-foreground"
        )}>{item.label}</span>
      </>
    );

    const commonButtonProps = {
      asChild: true,
      isActive: pathname === item.href,
      className: cn(
        "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out sidebar-menu-item-custom-glow p-0",
        pathname === item.href 
          ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30" 
          : "hover:bg-primary/20 hover:border-primary/40", 
      ),
    };

    const interactiveElement = (
      <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)} className="flex items-center gap-2 w-full h-full p-2">
        {linkContent}
      </Link>
    );

    if (isMobile) {
      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton {...commonButtonProps}>
             <SheetClose asChild>{interactiveElement}</SheetClose>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

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
       {/* Logout Button in SidebarFooter */}
        <SidebarFooter className="p-2 border-t border-sidebar-border shrink-0">
            <SidebarMenuButton
              variant="default" 
              className="w-full justify-start bg-destructive/20 text-destructive-foreground/80 hover:bg-destructive/40 hover:text-destructive-foreground sidebar-menu-item-custom-glow"
              onClick={handleLogout} 
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </SidebarMenuButton>
        </SidebarFooter>
    </Fragment>
  );
};


// --- Main App Layout Content ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  // const { isAuthenticated, isLoading: authLoading } = useAuth(); // Simplified
  const isClientMounted = useClientOnly(); 
  
  // Simplified loading state: AppContext loading is primary
  const isLoading = appContext.isLoading; 

  useEffect(() => {
    if (isClientMounted && !isLoading) {
      // Handle redirection for users based on list status
      const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
      
      // For local storage mode, userId from AppContext determines if a "session" exists
      const isEffectivelyAuthenticated = !!appContext.state.userId; 

      if (!isEffectivelyAuthenticated && pathname !== '/auth') {
        // If no user ID (not "logged in" in local storage terms) and not on auth page, redirect to auth
        console.log("AppLayoutContent: No user ID, redirecting to /auth");
        router.replace('/auth');
      } else if (isEffectivelyAuthenticated && !hasLists && pathname !== '/list/create-first' && pathname !== '/auth') {
        // If "logged in" but no lists, and not on create-first or auth, redirect to create-first
        console.log("AppLayoutContent: User ID exists, no lists, redirecting to /list/create-first");
        router.replace('/list/create-first');
      } else if (isEffectivelyAuthenticated && hasLists && (pathname === '/list/create-first' || pathname === '/auth')) {
         // If "logged in", has lists, but on create-first or auth, redirect to main list page
        console.log("AppLayoutContent: User ID exists, has lists, on create-first/auth, redirecting to /list");
        router.replace('/list');
      }
    }
  }, [isClientMounted, isLoading, appContext.state.userId, appContext.state.lists, pathname, router]);


  if (!isClientMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If on auth or create-first page, just render children
  if (pathname === '/auth' || (appContext.state.userId && appContext.state.lists.length === 0 && pathname === '/list/create-first')) {
    return <>{children}</>;
  }

  return (
     <Fragment>
       <MobileHeader />
        <Sidebar className="hidden md:flex md:flex-col">
         <MainMenuContent isMobile={false} />
       </Sidebar>
        <SidebarInset>
         <main className="flex-1 flex flex-col md:px-6 lg:px-8 xl:px-10 md:py-4 bg-background overflow-y-auto max-w-full">
            <div className="flex-grow pb-[calc(env(safe-area-inset-bottom)+6rem)]">
              {children}
            </div>
          </main>
        </SidebarInset>
      </Fragment>
  );
}

// --- Main App Layout Wrapper ---
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TooltipProvider delayDuration={0}>
        <AppLayoutContent>{children}</AppLayoutContent>
    </TooltipProvider>
  );
};

