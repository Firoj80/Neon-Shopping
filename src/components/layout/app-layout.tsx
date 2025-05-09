"use client";

import React, { useState, useEffect, Fragment, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Info,
  Mail,
  ShieldCheck as Policy,
  FileText as ArticleIcon,
  Star,
  AppWindow as AppsIcon,
  Menu as MenuIcon,
  X,
  Palette,
  UserCircle2 as ProfileIcon, // Using UserCircle2 for profile
  LogOut as LogoutIcon,
} from 'lucide-react';
import { Button, buttonVariants } from '../ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { useClientOnly } from '@/hooks/use-client-only';


// --- Profile Dropdown Content ---
interface ProfileDropdownProps {
  onLinkClick?: (href: string) => void;
}

const ProfileDropdownContent: React.FC<ProfileDropdownProps> = ({ onLinkClick }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const profileMenuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const handleLogout = () => {
    logout();
    // Optional: redirect to home or login page after logout
    router.push('/auth');
  };

  const handleProfileLinkClick = (href: string) => {
    if (onLinkClick) onLinkClick(href);
    router.push(href);
  };

  return (
    <DropdownMenuContent className="w-56 bg-card border-primary/30 shadow-neon glow-border-inner" align="end">
      {isAuthenticated && user && (
        <>
          <DropdownMenuLabel className="text-neonText/80 px-2 py-1.5 text-sm font-semibold">
            Hello, {user.name || 'User'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50" />
        </>
      )}
      {profileMenuItems.map((item) => (
        <DropdownMenuItem
          key={item.href}
          onClick={() => handleProfileLinkClick(item.href)}
          className={cn(
            "flex items-center gap-2 cursor-pointer hover:bg-primary/10 focus:bg-primary/20 text-neonText hover:text-primary py-1.5 px-2 text-sm",
            pathname === item.href && "bg-primary/20 text-primary"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator className="bg-border/50" />
      {isAuthenticated ? (
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer hover:bg-destructive/20 focus:bg-destructive/30 text-red-400 hover:text-red-300 py-1.5 px-2 text-sm"
        >
          <LogoutIcon className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          onClick={() => router.push('/auth')}
          className="flex items-center gap-2 cursor-pointer hover:bg-primary/10 focus:bg-primary/20 text-neonText hover:text-primary py-1.5 px-2 text-sm"
        >
          <ProfileIcon className="h-4 w-4" />
          <span>Login / Sign Up</span>
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  );
};


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
         <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
                <AnimatePresence initial={false} mode="wait">
                <motion.div
                    key={isSheetOpen ? "x" : "menu"}
                    initial={{ rotate: isSheetOpen ? -90 : 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: isSheetOpen ? 90 : -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {isSheetOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                </motion.div>
                </AnimatePresence>
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </SheetTrigger>
         <SidebarSheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
           <OtherLinksMenuContent onLinkClick={() => setIsSheetOpen(false)} isMobile={true}/>
         </SidebarSheetContent>
       </Sheet>

      {/* Center: App Name/Logo */}
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
           <ShoppingCart className="w-6 h-6" />
           <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>

      {/* Right Side: Profile Icon Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10">
            <ProfileIcon className="h-5 w-5" />
            <span className="sr-only">Open user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <ProfileDropdownContent />
      </DropdownMenu>
    </header>
  );
};


// --- Other Links Menu Content (for Mobile Sheet and Desktop Sidebar) ---
interface OtherLinksMenuContentProps {
  onLinkClick?: () => void;
  isMobile?: boolean;
}
const OtherLinksMenuContent: React.FC<OtherLinksMenuContentProps> = ({ onLinkClick, isMobile = false }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLinkClick = useCallback((href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onLinkClick) {
      onLinkClick();
    }
    setTimeout(() => {
      router.push(href);
    }, isMobile ? 150 : 0);
  }, [onLinkClick, router, isMobile]);

  const otherMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: typeof otherMenuItems[number]) => {
    const clickHandler = (e: React.MouseEvent<HTMLAnchorElement>) => {
      handleLinkClick(item.href, e);
    };

    const menuItemButton = (
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
        <Link href={item.href} onClick={clickHandler}>
          <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
          <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    );

    return (
      <SidebarMenuItem key={item.href}>
        {isMobile ? <SheetClose asChild>{menuItemButton}</SheetClose> : menuItemButton}
      </SidebarMenuItem>
    );
  };


  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow flex flex-col">
        <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto">
          {otherMenuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border shrink-0">
        <p className="text-xs text-muted-foreground text-center">© {new Date().getFullYear()} Neon Shopping</p>
      </SidebarFooter>
    </>
  );
};


// --- Main AppLayoutContent Component ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  const authState = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly();

  const [isLoading, setIsLoading] = useState(true); // Combined loading state

  useEffect(() => {
    // Combine loading states from auth and app context
    setIsLoading(appContext.isLoading || authState.isLoading);
  }, [appContext.isLoading, authState.isLoading]);

   // --- Redirect Logic ---
   useEffect(() => {
     if (isClientMounted && !isLoading) { // Ensure client mounted and all loading is done
        if (!authState.isAuthenticated && pathname !== '/auth') {
             console.log("User not authenticated, redirecting to /auth from:", pathname);
             router.replace('/auth');
        } else if (authState.isAuthenticated) {
            const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
            if (!hasLists && pathname !== '/list/create-first' && pathname !== '/auth') {
                console.log("User authenticated, no lists, redirecting to /list/create-first from:", pathname);
                router.replace('/list/create-first');
            } else if (hasLists && pathname === '/list/create-first') {
                console.log("User authenticated, has lists, redirecting to /list from /list/create-first");
                router.replace('/list');
            } else if (pathname === '/auth') { // If authenticated and somehow on /auth, redirect to /list
                 console.log("User authenticated, on /auth, redirecting to /list");
                 router.replace('/list');
            }
        }
     }
   }, [isClientMounted, isLoading, authState.isAuthenticated, appContext.state.lists, pathname, router]);


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

  // If on /auth page, render only children (the auth page itself)
  if (pathname === '/auth') {
    return <>{children}</>;
  }

  // --- Render full layout ---
  return (
     <Fragment>
       <MobileHeader />

        {/* Desktop Header (Simplified - No full sidebar, only profile menu) */}
        <header className="sticky top-0 z-30 hidden md:flex items-center justify-between h-14 px-6 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
                <ShoppingCart className="w-6 h-6" />
                <ClientOnly><span>Neon Shopping</span></ClientOnly>
            </Link>
            <div className="flex items-center gap-4">
                 {/* Desktop Sidebar for "Other" links - Can be a different component or removed if not needed */}
                 <Sheet>
                     <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                            <MenuIcon className="h-5 w-5" />
                            <span className="sr-only">Open Menu</span>
                        </Button>
                     </SheetTrigger>
                     <SidebarSheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
                        <OtherLinksMenuContent isMobile={true}/> {/* Re-use for consistency */}
                     </SidebarSheetContent>
                 </Sheet>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full">
                        <ProfileIcon className="h-6 w-6" />
                        <span className="sr-only">Open user menu</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <ProfileDropdownContent />
                </DropdownMenu>
            </div>
        </header>

        {/* Main Content Area */}
        <SidebarInset>
         <main className="flex-1 flex flex-col md:px-4 lg:px-6 xl:px-8 md:py-3 bg-background overflow-y-auto max-w-full">
            {children}
          </main>
        </SidebarInset>
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
