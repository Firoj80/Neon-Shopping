
"use client";

import React, { Fragment, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent as ShadSheetContent, 
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
  SidebarSheetContent, 
} from '@/components/ui/sidebar';
import {
  Menu as MenuIcon,
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
  X,
  DollarSign, 
  UserCircle2 as ProfileIcon,
  LogOut
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useClientOnly } from '@/hooks/use-client-only';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/auth-context';


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const mainNavItems = [
    // These are now in profile dropdown for mobile
  ];

  const secondaryMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star, target: '_blank', rel: 'noopener noreferrer', isExternal: true, url: 'https://play.google.com/store/apps/details?id=com.firoj.neonshopping' },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon, target: '_blank', rel: 'noopener noreferrer', isExternal: true, url: 'https://play.google.com/store/apps/developer?id=Featured+Cool+Apps' },
  ];
  
  const profileMenuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];


  const handleLinkClick = (url?: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (url && !url.startsWith('http')) { // Only prevent default for internal links
        // Allow Next Link to handle navigation
    }
    setIsOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    setIsOpen(false); 
    router.push('/auth'); 
  };

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
                {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
               </motion.div>
             </AnimatePresence>
             <span className="sr-only">Toggle Sidebar</span>
           </Button>
         </SheetTrigger>
         <SidebarSheetContent side="left" className="p-0 flex flex-col">
            <SidebarHeader className="p-4 border-b border-sidebar-border">
              <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary" onClick={() => handleLinkClick()}>
                <ShoppingCart className="w-6 h-6" />
                <ClientOnly><span>Neon Shopping</span></ClientOnly>
              </Link>
            </SidebarHeader>
            <SidebarContent className="flex-grow p-2 overflow-y-auto">
              <SidebarMenu>
                {secondaryMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                     <SheetClose asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        className={cn(
                          "group/menu-button justify-start w-full text-sm font-medium rounded-md px-3 py-2.5 hover:bg-primary/10",
                          pathname === item.href
                            ? "bg-primary/15 text-primary shadow-sm hover:text-primary"
                            : "text-sidebar-foreground hover:text-foreground"
                        )}
                      >
                        <Link 
                          href={item.isExternal ? item.url! : item.href} 
                          onClick={(e) => handleLinkClick(item.isExternal ? item.url : item.href, e)} 
                          target={item.target} 
                          rel={item.rel}
                        >
                          <item.icon className={cn("mr-3 h-5 w-5 transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-button:text-foreground")} />
                          {item.label}
                        </Link>
                      </SidebarMenuButton>
                    </SheetClose>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
               {user && (
                <>
                  <SidebarSeparator className="my-3" />
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={handleLogout}
                          className="group/menu-button justify-start w-full text-sm font-medium rounded-md px-3 py-2.5 text-sidebar-foreground hover:text-foreground hover:bg-destructive/10"
                        >
                          <LogOut className="mr-3 h-5 w-5 text-destructive" />
                          Logout
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                </>
               )}
            </SidebarContent>
         </SidebarSheetContent>
       </Sheet>

      <div className="flex-grow flex justify-center">
        <Link href="/list" className="flex items-center gap-2 text-xl font-semibold text-primary">
          <ShoppingCart className="w-7 h-7" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>
      
      <div className="w-[52px] flex items-center justify-end"> {/* Placeholder to balance the header */}
       {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                <ProfileIcon className="h-6 w-6" />
                <span className="sr-only">Open user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-primary/30 shadow-neon">
              <DropdownMenuLabel className="text-muted-foreground">{user.name || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/30"/>
              {profileMenuItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/15">
                  <Link href={item.href} className="flex items-center w-full">
                    <item.icon className={cn("mr-2 h-4 w-4", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-border/30"/>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive hover:!bg-destructive/20 focus:!bg-destructive/25">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};


// --- Main AppLayoutContent Component ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly();

  // Redirect logic using useEffect
  useEffect(() => {
    if (!isClientMounted || authLoading || !appContext.state.isInitialDataLoaded) {
      return; // Wait for client mount, auth, and app data
    }

    if (!isAuthenticated && pathname !== '/auth') {
      console.log("AppLayout: Not authenticated, redirecting to /auth from", pathname);
      router.replace('/auth');
    } else if (isAuthenticated) {
      const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
      if (!hasLists && pathname !== '/list/create-first' && pathname !== '/auth') {
        console.log("AppLayout: Authenticated, no lists, redirecting to /list/create-first from", pathname);
        router.replace('/list/create-first');
      } else if (hasLists && (pathname === '/list/create-first' || pathname === '/auth')) {
        console.log("AppLayout: Authenticated, lists exist, redirecting to /list from", pathname);
        router.replace('/list');
      }
    }
  }, [isClientMounted, isAuthenticated, authLoading, appContext.state.isInitialDataLoaded, appContext.state.lists, pathname, router]);


  // Initial loading state (client mount, auth, app data)
  if (!isClientMounted || authLoading || !appContext.state.isInitialDataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
        <div className="flex flex-col items-center">
          <ShoppingCart className="w-16 h-16 animate-pulse text-primary" />
          <p className="mt-4 text-lg font-semibold">Loading Neon Shopping...</p>
        </div>
      </div>
    );
  }
  
  // If on auth page, just render children (the auth page itself)
  if (pathname === '/auth') {
    return <>{children}</>;
  }

  // Fallback loading screen if redirection hasn't happened yet for some reason
  if (isAuthenticated && Array.isArray(appContext.state.lists) && appContext.state.lists.length === 0 && pathname !== '/list/create-first') {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
        <div className="flex flex-col items-center">
          <ShoppingCart className="w-16 h-16 animate-pulse text-primary" />
          <p className="mt-4 text-lg font-semibold">Preparing your space...</p>
        </div>
      </div>
    );
  }
  
  const secondaryMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star, target: '_blank', rel: 'noopener noreferrer', isExternal: true, url: 'https://play.google.com/store/apps/details?id=com.firoj.neonshopping' },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon, target: '_blank', rel: 'noopener noreferrer', isExternal: true, url: 'https://play.google.com/store/apps/developer?id=Featured+Cool+Apps' },
  ];

  const handleLogout = () => {
    // Call logout from AuthContext
    // authContext.logout(); // This will be handled via useAuth hook
  };


  return (
    <Fragment>
      <MobileHeader />
      <Sidebar className="hidden md:flex md:flex-col">
        <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
          <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <ShoppingCart className="w-6 h-6" />
            <ClientOnly><span>Neon Shopping</span></ClientOnly>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-grow p-2 overflow-y-auto">
           {/* Profile/Main links are now in Dropdown for Desktop as well or directly visible if sidebar is wide enough */}
           {/* For simplicity, let's assume profile dropdown handles this. If a full sidebar menu is desired, add items here. */}
          <SidebarMenu>
            {secondaryMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                   className={cn(
                     "group/menu-button justify-start w-full text-sm font-medium rounded-md px-3 py-2.5 hover:bg-primary/10",
                     pathname === item.href
                      ? "bg-primary/15 text-primary shadow-sm hover:text-primary"
                      : "text-sidebar-foreground hover:text-foreground"
                  )}
                >
                  <Link 
                    href={item.isExternal ? item.url! : item.href} 
                    target={item.target} 
                    rel={item.rel}
                  >
                    <item.icon className={cn("mr-3 h-5 w-5 transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-button:text-foreground")} />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         {user && (
            <SidebarFooter className="p-2 border-t border-sidebar-border">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start items-center text-sidebar-foreground hover:text-foreground hover:bg-primary/10">
                            <ProfileIcon className="mr-2 h-5 w-5" /> 
                            <span>{user.name || user.email}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="bg-card border-primary/30 shadow-neon w-56">
                        <DropdownMenuLabel className="text-muted-foreground">{user.name || user.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/30"/>
                        {/* Profile Menu Items for Desktop */}
                        {profileMenuItems.map((item) => (
                            <DropdownMenuItem key={item.href} asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/15">
                                <Link href={item.href} className="flex items-center w-full">
                                <item.icon className={cn("mr-2 h-4 w-4", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                                <span>{item.label}</span>
                                </Link>
                            </DropdownMenuItem>
                         ))}
                        <DropdownMenuSeparator className="bg-border/30"/>
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive hover:!bg-destructive/20 focus:!bg-destructive/25">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        )}
      </Sidebar>

      <main className="flex flex-1 flex-col md:ml-64 bg-background text-foreground overflow-y-auto">
         <div className="flex-grow p-0 sm:p-0 md:p-0"> {/* Removed padding to make it full width */}
            {children}
         </div>
      </main>
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
