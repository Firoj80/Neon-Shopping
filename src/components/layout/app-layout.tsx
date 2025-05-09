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
  ShieldCheck as Policy, // Renamed ShieldCheck to Policy
  FileText as ArticleIcon, // Renamed FileText to Article
  Star,
  AppWindow as AppsIcon, // Corrected AppsIcon to AppWindow
  Menu as MenuIcon, // Keep Menu as Menu
  X,
  DollarSign, // Added for Currency
  Palette, // Added for Themes
} from 'lucide-react';
import { Button, buttonVariants } from '../ui/button'; // Import buttonVariants
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
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    // Use flex with justify-between initially, but center the title with a placeholder
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "mr-2 text-primary hover:text-primary/80 hover:bg-primary/10"
            )}
          >
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
          </SheetTrigger>
         <SidebarSheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground">
           <MainMenuContent onLinkClick={() => setIsOpen(false)} isMobile={true}/>
         </SidebarSheetContent>
       </Sheet>

      {/* Center: App Name/Logo */}
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
           <ShoppingCart className="w-6 h-6" />
           <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>

      {/* Right Side: Placeholder for potential icons or empty span for spacing */}
      <span className="w-10 h-10"></span> {/* Spacer to help center title, matches approx width of SheetTrigger button */}
    </header>
  );
};


// --- Main Menu Content (Reusable for Mobile Sheet and Desktop Sidebar) ---
interface MainMenuContentProps {
  onLinkClick?: () => void;
  isMobile?: boolean;
}
const MainMenuContent: React.FC<MainMenuContentProps> = ({ onLinkClick, isMobile = false }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLinkClick = useCallback((href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onLinkClick) {
      onLinkClick();
    }
    // Add a small delay to allow sheet to close before navigation, if on mobile
    setTimeout(() => {
      router.push(href);
    }, isMobile ? 150 : 0);
  }, [onLinkClick, router, isMobile]);

  const menuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/themes', label: 'Themes', icon: Palette },
    { type: 'separator' as const },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
  ];

  const renderMenuItem = (item: typeof menuItems[number], index: number) => {
    if (item.type === 'separator') {
      return <SidebarSeparator key={`separator-${index}`} className="my-2" />;
    }

    const { href, label, icon: ItemIcon } = item;

    const clickHandler = (e: React.MouseEvent<HTMLAnchorElement>) => {
      handleLinkClick(href, e);
    };

    const menuItemButton = (
      <SidebarMenuButton
        asChild
        isActive={pathname === href}
        className={cn(
          "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out",
          "text-neonText hover:text-white",
          "hover:border-secondary/50 hover:shadow-neon focus:shadow-neon-lg glow-border-inner",
          pathname === href
            ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30"
            : "hover:bg-primary/10 hover:border-primary/30"
        )}
      >
        <Link href={href} onClick={clickHandler}>
          <ItemIcon className={cn("transition-colors", pathname === href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
          <span className={cn("transition-colors text-neonText", pathname === href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{label}</span>
        </Link>
      </SidebarMenuButton>
    );

    // For mobile, wrap the button in SheetClose to close the sheet on click
    return (
      <SidebarMenuItem key={href}>
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
          {menuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border shrink-0">
        {/* Footer content can go here if needed */}
        <p className="text-xs text-muted-foreground text-center">© {new Date().getFullYear()} Neon Shopping</p>
      </SidebarFooter>
    </>
  );
};


// --- Main AppLayoutContent Component ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [isClientMounted, setIsClientMountedHook] = useState(false);

  useEffect(() => {
    setIsClientMountedHook(true);
  }, []);

  useEffect(() => {
    setIsLoading(appContext.isLoading);
  }, [appContext.isLoading]);


   // --- Redirect Logic ---
   // Redirect after ensuring client-side and loading is complete
   useEffect(() => {
     if (isClientMounted && !isLoading) {
       const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
       // Redirect to create-first page if no lists exist and not already there
       if (!hasLists && pathname !== '/list/create-first' && pathname !== '/auth') { // Ensure not on auth page
          router.replace('/list/create-first');
       }
       // Redirect to list page if lists exist and currently on create page
       else if (hasLists && pathname === '/list/create-first') {
         router.replace('/list');
       }
     }
   }, [isClientMounted, isLoading, appContext.state.lists, pathname, router]);


  // --- Loading State ---
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


  // --- Render full layout ---
  return (
     <Fragment>
       {/* Mobile Header */}
       <MobileHeader />

        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex md:flex-col">
         <MainMenuContent />
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset>
         <main className="flex-1 flex flex-col md:p-4 lg:p-6 xl:px-8 xl:py-4 bg-background overflow-y-auto max-w-full"> {/* Adjusted padding and max-width */}
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
