"use client"; // This component needs client-side hooks like useState, useEffect, usePathname

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
  ShieldCheck as Policy, // Renamed ShieldCheck
  FileText as ArticleIcon, // Renamed FileText
  Star,
  AppWindow as AppsIcon, // Renamed AppWindow
  Menu as MenuIcon, // Renamed Menu
  X,
  // Removed duplicate/unused icons
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose, // Added SheetClose
} from "@/components/ui/sheet"; // Keep Sheet related imports
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
    // Removed SidebarProvider, useSidebar as they are not used here
} from '@/components/ui/sidebar'; // Import Sidebar component
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip"; // Added TooltipProvider
import { useClientOnly } from '@/hooks/use-client-only'; // Import the custom hook


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // Use state for sheet open/close

  return (
    // Use flex with justify-between initially, but center the title with a placeholder
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10 w-10 h-10 flex-shrink-0">
             <AnimatePresence initial={false} mode="wait">
               <motion.div
                  key={isOpen ? "x" : "menu"}
                  initial={{ rotate: isOpen ? 90 : -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: isOpen ? -90 : 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                 {isOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
               </motion.div>
             </AnimatePresence>
            <span className="sr-only">Toggle Sidebar</span>
           </Button>
        </SheetTrigger>
        {/* Mobile Sidebar Content */}
        <MobileSidebarContent isOpen={isOpen} setIsOpen={setIsOpen}/>
       </Sheet>

      {/* Center: App Name/Logo */}
      <div className="flex-grow text-center"> {/* Added container to center title */}
          <Link href="/list" className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
              <ShoppingCart className="w-6 h-6" />
              <ClientOnly><span className="font-bold text-neonText">Neon Shopping</span></ClientOnly>
          </Link>
      </div>

      {/* Right Side: Placeholder to balance the hamburger menu */}
       <div className="w-10 h-10 flex-shrink-0"></div> {/* Placeholder with same width as button */}

    </header>
  );
};

// --- Mobile Sidebar Content Component ---
const MobileSidebarContent: React.FC<{ isOpen: boolean; setIsOpen: (open: boolean) => void }> = ({ isOpen, setIsOpen }) => {
    const router = useRouter();
    const pathname = usePathname();
    const isClient = useClientOnly(); // Use the hook

    // Define menu items
    const menuItems = [
        { href: '/list', label: 'Shopping List', icon: ShoppingCart },
        { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/history', label: 'History', icon: History },
        { href: '/settings', label: 'Settings', icon: Settings },
        { href: '/themes', label: 'Themes', icon: Palette },
        { href: '/about', label: 'About Us', icon: Info },
        { href: '/contact', label: 'Contact Us', icon: Mail },
        { href: '/privacy', label: 'Privacy Policy', icon: Policy },
        { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
        { href: '/rate', label: 'Rate App', icon: Star },
        { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
    ];

    const handleLinkClick = (itemHref: string, event?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        event?.preventDefault();
        router.push(itemHref);
        setIsOpen(false); // Close sidebar on link click
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
        if (!isClient) return false;
        return pathname === itemHref;
    }, [pathname, isClient]);


    return (
         <SheetContent side="left" className="w-3/4 max-w-[300px] bg-sidebar p-0 flex flex-col" aria-describedby="mobile-sidebar-title">
          <SheetHeader className="p-4 border-b border-sidebar-border shrink-0">
            <SheetTitle id="mobile-sidebar-title" className="sr-only">Navigation Menu</SheetTitle> {/* Accessible Title */}
            <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary" onClick={() => setIsOpen(false)}>
                <ShoppingCart className="w-6 h-6" />
                <ClientOnly><span className="font-bold text-neonText">Neon Shopping</span></ClientOnly>
            </Link>
           </SheetHeader>
            <SidebarContent className="p-2 flex-grow overflow-y-auto">
                <SidebarMenu className="space-y-1.5">
                    {menuItems.map((item) => (
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
         </SheetContent>
    );
};


// --- Main App Layout Component ---
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const appContext = useAppContext();
  const { isLoading } = appContext;
  const isClientMounted = useClientOnly(); // Use the hook to check if mounted

    // Define menu items for desktop sidebar
    const mainNavItems = [
        { href: '/list', label: 'Shopping List', icon: ShoppingCart },
        { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/history', label: 'History', icon: History },
        { href: '/settings', label: 'Settings', icon: Settings },
        { href: '/themes', label: 'Themes', icon: Palette },
        { href: '/about', label: 'About Us', icon: Info },
        { href: '/contact', label: 'Contact Us', icon: Mail },
        { href: '/privacy', label: 'Privacy Policy', icon: Policy },
        { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
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
    if (!isClientMounted) return false; // Don't determine active state on server
    return pathname === itemHref;
  }, [pathname, isClientMounted]);

   useEffect(() => {
    // Redirect logic needs to run only after client mount and loading is complete
    if (isClientMounted && !isLoading) {
      if (appContext.state.lists.length === 0 && pathname !== '/list/create-first' && pathname !== '/auth') {
        console.log("Redirecting to /list/create-first");
        router.replace('/list/create-first');
      } else if (appContext.state.lists.length > 0 && pathname === '/list/create-first') {
        console.log("Redirecting to /list");
        router.replace('/list');
      }
    }
  }, [isClientMounted, isLoading, appContext.state.lists.length, pathname, router]);


  // --- Loading State ---
  if (!isClientMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- Render full layout ---
   return (
    <Fragment> {/* Replaced SidebarProvider with Fragment */}
       {/* Desktop Sidebar */}
       <Sidebar className="hidden md:flex md:flex-col">
         <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
           <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
             <ShoppingCart className="w-6 h-6" />
             <ClientOnly><span className="font-bold text-neonText">Neon Shopping</span></ClientOnly>
           </Link>
         </SidebarHeader>
         <SidebarContent className="p-2 flex flex-col flex-grow overflow-y-auto">
           <SidebarMenu className="space-y-1.5 flex-grow">
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
         <MobileHeader /> {/* Mobile header with sheet trigger */}
         <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-[calc(1rem+env(safe-area-inset-bottom)+50px)] md:pb-[calc(1.5rem+env(safe-area-inset-bottom)+50px)]">
           {children}
         </main>
         {/* Ad Banner Placeholder */}
         <div className="fixed bottom-0 left-0 right-0 h-[50px] bg-card/90 backdrop-blur-sm border-t border-border/30 flex items-center justify-center text-xs text-muted-foreground z-40 glow-border shadow-neon-lg">
           <ClientOnly><span className='text-muted-foreground/70'>Ad Banner Area</span></ClientOnly>
         </div>
       </SidebarInset>
     </Fragment>
   );
}