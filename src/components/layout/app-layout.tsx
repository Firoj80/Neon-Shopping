"use client";

import React, { Fragment, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
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
  SidebarSeparator,
  SidebarSheetContent, // Use the custom SidebarSheetContent
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
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useClientOnly } from '@/hooks/use-client-only';

const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const secondaryMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star, target: '_blank', rel: 'noopener noreferrer', isExternal: true, url: 'https://play.google.com/store/apps/details?id=com.firoj.neonshopping' },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon, target: '_blank', rel: 'noopener noreferrer', isExternal: true, url: 'https://play.google.com/store/apps/developer?id=Featured+Cool+Apps' },
  ];

  const handleLinkClick = () => {
    setIsOpen(false); 
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
              <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary" onClick={handleLinkClick}>
                <ShoppingCart className="w-6 h-6" />
                <ClientOnly><span>Neon Shopping</span></ClientOnly>
              </Link>
            </SidebarHeader>
            <SidebarContent className="flex-grow p-2 overflow-y-auto">
              <SidebarMenu>
                {mainNavItems.map((item) => (
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
                        <Link href={item.href} onClick={handleLinkClick}>
                          <item.icon className={cn("mr-3 h-5 w-5 transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-button:text-foreground")} />
                          {item.label}
                        </Link>
                      </SidebarMenuButton>
                    </SheetClose>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <SidebarSeparator className="my-3" />
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
                          onClick={handleLinkClick} 
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
            </SidebarContent>
         </SidebarSheetContent>
       </Sheet>

      <div className="flex-grow flex justify-center">
        <Link href="/list" className="flex items-center gap-2 text-xl font-semibold text-primary">
          <ShoppingCart className="w-7 h-7" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </div>
      <div className="w-[52px]" />
    </header>
  );
};

const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, state } = appContext; 
  const isClientMounted = useClientOnly();

  useEffect(() => {
    if (isClientMounted && !isLoading && state.isInitialDataLoaded) {
      const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
      
      if (!hasLists && pathname !== '/list/create-first') { 
        router.replace('/list/create-first');
      } else if (hasLists && pathname === '/list/create-first') {
        router.replace('/list');
      }
    }
  }, [isClientMounted, isLoading, state.isInitialDataLoaded, appContext.state.lists, pathname, router]);

  if (!isClientMounted || isLoading || !state.isInitialDataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
        <div className="flex flex-col items-center">
          <ShoppingCart className="w-16 h-16 animate-pulse text-primary" />
          <p className="mt-4 text-lg font-semibold">Loading Neon Shopping...</p>
        </div>
      </div>
    );
  }
  
  const mainNavItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
  ];

  const secondaryMenuItems = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star, target: '_blank', rel: 'noopener noreferrer', isExternal: true, url: 'https://play.google.com/store/apps/details?id=com.firoj.neonshopping' },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon, target: '_blank', rel: 'noopener noreferrer', isExternal: true, url: 'https://play.google.com/store/apps/developer?id=Featured+Cool+Apps' },
  ];
  
  if (Array.isArray(appContext.state.lists) && appContext.state.lists.length === 0 && pathname !== '/list/create-first') {
     return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
         <div className="flex flex-col items-center">
           <ShoppingCart className="w-16 h-16 animate-pulse text-primary" />
           <p className="mt-4 text-lg font-semibold">Preparing your space...</p>
         </div>
       </div>
     );
  }

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
          <SidebarMenu>
            {mainNavItems.map((item) => (
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
                  <Link href={item.href}>
                    <item.icon className={cn("mr-3 h-5 w-5 transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-button:text-foreground")} />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarSeparator className="my-3" />
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
      </Sidebar>
      <main className="flex flex-1 flex-col md:ml-64 bg-background text-foreground overflow-y-auto">
         <div className="flex-grow p-4 sm:p-6 md:p-8">
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
