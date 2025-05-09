"use client";

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
  ShieldCheck as PolicyIcon, // Renamed for clarity
  FileText as ArticleIcon,  // Renamed for clarity
  Star,
  AppWindow as AppsIcon,
  Menu as MenuIcon, // Renamed Menu to avoid conflict
  X,
  DollarSign, // Added for Currency
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent
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
import { useClientOnly } from '@/hooks/use-client-only';


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger asChild>
           <Button variant="ghost" size="icon" className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
             <span className="flex items-center justify-center h-full w-full">
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
             </span>
             <span className="sr-only">Toggle Sidebar</span>
           </Button>
         </SheetTrigger>
         <SidebarSheetContent side="left" className="w-[280px]">
              <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
                 <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <ShoppingCart className="w-6 h-6" />
                    <ClientOnly><span>Neon Shopping</span></ClientOnly>
                 </Link>
             </SidebarHeader>
             <SidebarContent className="p-2 flex flex-col flex-grow overflow-y-auto">
                  <MainMenuContent onNavigate={() => setIsOpen(false)} isMobileSheet={true} />
             </SidebarContent>
             <SidebarFooter className="p-2 border-t border-sidebar-border">
                 <hr className="my-3 border-sidebar-border/50" />
                 <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
             </SidebarFooter>
         </SidebarSheetContent>
       </Sheet>

      {/* Center: App Name/Logo */}
       <div className="flex-grow flex items-center justify-center">
          <Link href="/list" className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
            <ShoppingCart className="w-6 h-6" />
             <ClientOnly><span>Neon Shopping</span></ClientOnly>
          </Link>
        </div>

      {/* Right Side: Placeholder to balance the layout */}
      <div className="w-10 h-10 flex-shrink-0"></div>
    </header>
  );
};


// --- Menu Items ---
const primaryMenuItems = [
    { href: '/list', label: 'Shopping List', icon: ShoppingCart },
    { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
];

const secondaryMenuItems = [
    { href: '/themes', label: 'Themes', icon: Palette },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: PolicyIcon },
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon },
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
];


// --- Main Menu Content Component ---
interface MainMenuContentProps {
    onNavigate?: () => void;
    isMobileSheet?: boolean;
}
const MainMenuContent: React.FC<MainMenuContentProps> = ({ onNavigate, isMobileSheet = false }) => {
    const pathname = usePathname();

    const isItemActive = useCallback((itemHref: string) => {
        return pathname === itemHref;
    }, [pathname]);

     const menuItemClasses = cn(
        "group/menu-item relative flex items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm",
        "border border-primary/30 hover:border-secondary hover:bg-primary/10 shadow-[0_0_5px_theme(colors.primary.DEFAULT)/0.5] hover:shadow-[0_0_10px_theme(colors.secondary.DEFAULT)/0.7,0_0_4px_theme(colors.secondary.DEFAULT)/0.9]",
        "transition-all duration-300 ease-in-out glow-border-inner",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:shadow-[0_0_12px_2px_theme(colors.secondary.DEFAULT)/0.6,0_0_4px_theme(colors.secondary.DEFAULT)/0.8)]",
        "[&_svg]:size-5 [&_svg]:shrink-0",
        "[&_span:last-child]:truncate"
        );

    const activeItemClasses = cn(
        "bg-primary/20 text-primary font-medium border-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)/0.8]",
        "hover:text-secondary hover:border-secondary hover:shadow-[0_0_15px_3px_theme(colors.secondary.DEFAULT)/0.7,0_0_5px_theme(colors.secondary.DEFAULT)/0.9)]"
    );

    const handleLinkClick = (href: string, event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      if (onNavigate) {
        onNavigate();
      }
    };

     const renderLink = (item: { href: string; label: string; icon: React.ElementType }) => (
         <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
             <item.icon className={cn("transition-colors", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
             <span className={cn("transition-colors text-neonText", isItemActive(item.href) ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
         </Link>
     );

     const renderMenuItems = (items: typeof primaryMenuItems) => (
         items.map((item) => (
             <SidebarMenuItem key={item.href}>
                 {isMobileSheet ? (
                     <SheetClose asChild>
                         <SidebarMenuButton
                             asChild
                             isActive={isItemActive(item.href)}
                             tooltip={item.label}
                             className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                         >
                             {renderLink(item)}
                         </SidebarMenuButton>
                     </SheetClose>
                 ) : (
                     <SidebarMenuButton
                         asChild
                         isActive={isItemActive(item.href)}
                         tooltip={item.label}
                         className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                     >
                         {renderLink(item)}
                     </SidebarMenuButton>
                 )}
             </SidebarMenuItem>
         ))
     );

    return (
         <div className="flex flex-col flex-grow">
             <SidebarMenu className="space-y-1.5 flex-grow overflow-y-auto">
                 {renderMenuItems(primaryMenuItems)}
                 <SidebarSeparator className="my-2" />
                 {renderMenuItems(secondaryMenuItems)}
             </SidebarMenu>
        </div>
    );
};


// --- Main App Layout Content Component ---
const AppLayoutContent = React.memo(({ children }: { children: React.ReactNode }) => {
  // --- Hooks (must be called unconditionally) ---
  const appContext = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useClientOnly(); // Use the hook to ensure client-side logic runs post-hydration
  const { isLoading } = appContext;

  // --- Redirection Logic (useEffect is a hook, call it unconditionally) ---
  useEffect(() => {
    if (isClient && !isLoading) { // Perform checks inside useEffect
      const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;

      // Redirect to create-first page if no lists exist and not already there
      if (!hasLists && pathname !== '/list/create-first') {
        router.replace('/list/create-first');
      }

      // Redirect to list page if lists exist and currently on create page
      if (hasLists && pathname === '/list/create-first') {
        router.replace('/list');
      }
    }
  }, [isClient, isLoading, appContext.state.lists, pathname, router]);

  // --- Loading State and Redirecting Check (for rendering decision) ---
  const showLoader = !isClient || isLoading;
  
  // Determine if a redirect is likely to occur to also show loader
  const isRedirectingLogic = isClient && !isLoading && (
    (Array.isArray(appContext.state.lists) && appContext.state.lists.length === 0 && pathname !== '/list/create-first') ||
    (Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0 && pathname === '/list/create-first')
  );

  if (showLoader || isRedirectingLogic) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
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
          <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
            <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
              <ShoppingCart className="w-6 h-6" />
              <ClientOnly><span>Neon Shopping</span></ClientOnly>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2 flex flex-col flex-grow overflow-y-auto">
              <MainMenuContent />
          </SidebarContent>
           <SidebarFooter className="p-2 border-t border-sidebar-border">
             <hr className="my-3 border-sidebar-border/50" />
             <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
         <SidebarInset className="flex flex-col min-h-screen">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 xl:p-10 pb-[calc(1rem+env(safe-area-inset-bottom))+50px] md:pb-[calc(1.5rem+env(safe-area-inset-bottom))+50px]">
               {children}
            </main>
          </SidebarInset>
       </Fragment>
   );
});
AppLayoutContent.displayName = 'AppLayoutContent';

// --- Main App Layout Component (now simpler) ---
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
       <TooltipProvider delayDuration={0}>
         <AppLayoutContent>{children}</AppLayoutContent>
       </TooltipProvider>
  );
}