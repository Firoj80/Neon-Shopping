"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  LayoutDashboard as DashboardIcon,
  History,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Mail,
  ShieldCheck as Policy,
  FileText as ArticleIcon,
  Star,
  Grid as AppsIcon,
  Menu as MenuIcon,
  X,
  LogOut as LogoutIcon,
  PlusCircle,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger, SidebarRail, SidebarSeparator, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarGroupAction, SidebarMenuBadge } from '@/components/ui/sidebar';
import ClientOnly from '@/components/client-only';

const MobileHeader: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const toggleSidebar = () => {
    setOpenMobile(!openMobile);
  };

  const profileMenuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: DashboardIcon },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
    { href: '/about', label: 'About Us', icon: InfoIcon },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy },
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const handleLinkClick = (itemHref: string, event?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event?.preventDefault();
    router.push(itemHref);
    setOpenMobile(false);
  };


  const menuItemClasses = cn(
    "group/menu-item relative flex items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm",
    "border border-primary/30 hover:border-secondary hover:bg-primary/10 shadow-[0_0_5px_theme(colors.primary.DEFAULT)/0.5] hover:shadow-[0_0_10px_theme(colors.secondary.DEFAULT)/0.7,0_0_4px_theme(colors.secondary.DEFAULT)/0.9]",
    "transition-all duration-300 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:shadow-[0_0_12px_2px_theme(colors.secondary.DEFAULT)/0.6,0_0_4px_theme(colors.secondary.DEFAULT)/0.8)]",
    "[&_svg]:size-5 [&_svg]:shrink-0",
    "[&_span:last-child]:truncate"
  );

  const activeItemClasses = cn(
    "bg-primary/20 text-primary font-medium border-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)/0.8]",
    "hover:text-secondary hover:border-secondary hover:shadow-[0_0_15px_3px_theme(colors.secondary.DEFAULT)/0.7,0_0_5px_theme(colors.secondary.DEFAULT)/0.9)]"
  );

  const isItemActive = useCallback((itemHref: string) => {
    if (!isClientMounted) return false;
    return pathname === itemHref;
  }, [pathname, isClientMounted]);

  return (
    <ClientOnly>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={openMobile ? "x" : "menu"}
              initial={{ rotate: openMobile ? 90 : -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: openMobile ? -90 : 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {openMobile ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold text-neonText">Neon Shopping</span>
        </Link>


      </header>
      <Sidebar className="md:hidden" side="left" collapsible="offcanvas" open={openMobile} onOpenChange={setOpenMobile}>
         <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
           <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary" onClick={() => setOpenMobile(false)}>
            <ShoppingCart className="w-6 h-6" />
             <ClientOnly><span className="font-bold text-neonText">Neon Shopping</span></ClientOnly>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col flex-grow overflow-y-auto">
          <SidebarMenu className="flex-grow space-y-1.5 overflow-y-auto">
            {profileMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item.href)}
                  className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                >
                  <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                    <item.icon className={cn("transition-colors", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                    <span className={cn("transition-colors text-neonText", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {footerMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item.href)}
                  className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                >
                  <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                    <item.icon className={cn("transition-colors", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                    <span className={cn("transition-colors text-neonText", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <hr className="my-3 border-sidebar-border/50" />
          <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
        </SidebarFooter>
      </Sidebar>
    </ClientOnly>
  );
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const mainNavItems: { href: string; label: string; icon: React.ElementType }[] = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: DashboardIcon },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
    { href: '/about', label: 'About Us', icon: InfoIcon },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy },
    { href: '/terms', label: 'Terms of Service', icon: FileText },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const menuItemClasses = cn(
    "group/menu-item relative flex items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm",
    "border border-primary/30 hover:border-secondary hover:bg-primary/10 shadow-[0_0_5px_theme(colors.primary.DEFAULT)/0.5] hover:shadow-[0_0_10px_theme(colors.secondary.DEFAULT)/0.7,0_0_4px_theme(colors.secondary.DEFAULT)/0.9]",
    "transition-all duration-300 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:shadow-[0_0_12px_2px_theme(colors.secondary.DEFAULT)/0.6,0_0_4px_theme(colors.secondary.DEFAULT)/0.8)]",
    "[&_svg]:size-5 [&_svg]:shrink-0",
    "[&_span:last-child]:truncate"
  );

  const activeItemClasses = cn(
    "bg-primary/20 text-primary font-medium border-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)/0.8]",
    "hover:text-secondary hover:border-secondary hover:shadow-[0_0_15px_3px_theme(colors.secondary.DEFAULT)/0.7,0_0_5px_theme(colors.secondary.DEFAULT)/0.9)]"
  );

  const isItemActive = useCallback((itemHref: string) => {
    if (!isClientMounted) return false;
    return pathname === itemHref;
  }, [pathname, isClientMounted]);

  return (
       <ClientOnly>
            <MobileHeader />

            <Sidebar className="hidden md:flex md:flex-col">
                <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
                    <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
                        <ShoppingCart className="w-6 h-6" />
                        <ClientOnly><span className="font-bold text-neonText">Neon Shopping</span></ClientOnly>
                    </Link>
                </SidebarHeader>
                <SidebarContent className="p-2 flex flex-col flex-grow overflow-y-auto">
                    {/* Main navigation for desktop */}
                    <SidebarMenu className="space-y-1.5">
                        {mainNavItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isItemActive(item.href)}
                                    tooltip={item.label}
                                    className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                                >
                                    <Link href={item.href}>
                                        <item.icon className={cn("transition-colors", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                                        <span className={cn("transition-colors text-neonText", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="p-2 border-t border-sidebar-border">
                    <hr className="my-3 border-sidebar-border/50" />
                    <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
                </SidebarFooter>
            </Sidebar>

            {/* Main Content Area */}
            <SidebarInset className="flex flex-col min-h-screen">
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-[calc(1rem+env(safe-area-inset-bottom)+50px)] md:pb-[calc(1.5rem+env(safe-area-inset-bottom)+50px)]">
                    {children}
                </main>
                 {/* Ad Banner Placeholder - for layout spacing */}
                <div className="fixed bottom-0 left-0 right-0 h-[50px] bg-card/90 backdrop-blur-sm border-t border-border/30 flex items-center justify-center text-xs text-muted-foreground z-40 glow-border shadow-neon-lg">
                   <ClientOnly><span className='text-muted-foreground/70'>Ad Banner Area</span></ClientOnly>
                </div>
            </SidebarInset>
       </ClientOnly>
  );
}
