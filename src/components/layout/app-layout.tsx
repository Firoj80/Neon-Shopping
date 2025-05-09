"use client";

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Sheet,
  SheetTrigger,
  SheetClose, // Added SheetClose
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
  Palette, // Keep Palette for Themes if needed
  Info,
  Mail,
  ShieldCheck as PolicyIcon, // Renamed ShieldCheck to PolicyIcon
  FileText as ArticleIcon, // Renamed FileText to ArticleIcon
  Star,
  AppWindow as AppsIcon, // Corrected AppsIcon to AppWindow
  X,
  DollarSign, // Added for Currency
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip"; // Added TooltipProvider
// Removed useClientOnly import as it's handled in the context/hooks now

import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link'; // Import Link



// Define menu items arrays (could be moved to a config file)
const primaryMenuItems = [
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
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
];

// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  // const isClient = useClientOnly(); // Use the hook
  const [isOpen, setIsOpen] = useState(false); // Local state for sheet

  // Placeholder for client-side only rendering if needed
  // if (!isClient) {
  //   return (
  //     <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 md:hidden">
  //       {/* Placeholders */}
  //     </header>
  //   );
  // }

  return (
    // Use flex with justify-between initially, but center the title with a placeholder
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger asChild>
           <Button variant="ghost" size="icon" /* onClick removed, Sheet handles it */ className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
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
         {/* Mobile Sidebar Content using SheetContent */}
         {/* Removed isOpen and setIsOpen props */}
         <SidebarSheetContent side="left" className="w-[280px]">
             {/* Render the menu content within the mobile sheet */}
              <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
                 {/* Use SheetClose to close the sheet when clicking the link */}
                 <SheetClose asChild>
                    <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
                        <ShoppingCart className="w-6 h-6" />
                        <ClientOnly><span>Neon Shopping</span></ClientOnly>
                    </Link>
                 </SheetClose>
             </SidebarHeader>
             <SidebarContent className="p-2 flex flex-col flex-grow overflow-y-auto">
                  <MainMenuContent onNavigate={() => setIsOpen(false)} />
             </SidebarContent>
             <SidebarFooter className="p-2 border-t border-sidebar-border">
                 <hr className="my-3 border-sidebar-border/50" />
                 <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
             </SidebarFooter>
         </SidebarSheetContent>
       </Sheet>

      {/* Center: App Name/Logo */}
      <div className="flex-grow text-center">
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


// --- Main Menu Content Component ---
// Added onNavigate prop to close the sheet when navigating
interface MainMenuContentProps {
    onNavigate?: () => void;
}
const MainMenuContent: React.FC<MainMenuContentProps> = ({ onNavigate }) => {
    const pathname = usePathname();
    // Removed useClientOnly as it's not strictly necessary for isActive logic here

    const isItemActive = useCallback((itemHref: string) => {
        // Can safely compare pathname on client or server if `use client` is above
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
        onNavigate(); // Call the callback to close the sheet
      }
      // Allow default navigation
    };

    return (
         <div className="flex flex-col flex-grow"> {/* Ensure content takes available space */}
             {/* Primary Menu Items */}
             <SidebarMenu className="space-y-1.5 flex-grow">
                 {primaryMenuItems.map((item) => (
                     <SidebarMenuItem key={item.href}>
                         <SidebarMenuButton
                             asChild
                             isActive={isItemActive(item.href)}
                             tooltip={item.label}
                             className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                         >
                            {/* Wrap Link with SheetClose for mobile */}
                            <SheetClose asChild>
                                <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                                    <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                                    <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                                </Link>
                             </SheetClose>
                         </SidebarMenuButton>
                     </SidebarMenuItem>
                 ))}
             </SidebarMenu>

              {/* Separator */}
              <SidebarSeparator className="my-2" />

               {/* Secondary Menu Items */}
                <SidebarMenu className="space-y-1.5">
                    {secondaryMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isItemActive(item.href)}
                            tooltip={item.label}
                            className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                        >
                         {/* Wrap Link with SheetClose for mobile */}
                         <SheetClose asChild>
                            <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                                <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                                <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                            </Link>
                          </SheetClose>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    ))}
                </SidebarMenu>
        </div>
    );
};


// --- Main App Layout Content Component ---
const AppLayoutContent = React.memo(({ children }: { children: React.ReactNode }) => {
  // --- Ensure all hooks are called unconditionally at the top level ---
  const appContext = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  // Removed useClientOnly as redirect logic is now in useEffect
  const { isLoading } = appContext;
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // --- Loading State Handling ---
  useEffect(() => {
    if (!isLoading) {
      setInitialLoadComplete(true);
    }
  }, [isLoading]);

  // --- Redirect Logic ---
  // Moved inside useEffect to prevent rendering during rendering
  useEffect(() => {
    if (!isLoading) {
      // Redirect to create-first page if no lists exist and not already there
      if (Array.isArray(appContext.state.lists) && appContext.state.lists.length === 0 && pathname !== '/list/create-first') {
        console.log("Redirecting to /list/create-first");
        router.replace('/list/create-first');
      }
      // Redirect to list page if lists exist and currently on create page
      else if (Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0 && pathname === '/list/create-first') {
        console.log("Redirecting to /list");
        router.replace('/list');
      }
    }
  }, [initialLoadComplete, isLoading, appContext.state.lists, pathname, router]);


  // --- Loading State ---
  // Show loader if still loading or redirect is pending
   const needsRedirect = (!isLoading && Array.isArray(appContext.state.lists) && appContext.state.lists.length === 0 && pathname !== '/list/create-first') ||
                         (!isLoading && Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0 && pathname === '/list/create-first');


   if (isLoading || needsRedirect) {
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
            {/* Render the menu content within the desktop sidebar */}
             <MainMenuContent />
         </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
            <hr className="my-3 border-sidebar-border/50" />
            <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
         </SidebarFooter>
       </Sidebar>

       {/* Main Content Area */}
        <SidebarInset className="flex flex-col min-h-screen">
           <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 xl:p-10 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"> {/* Adjusted padding */}
              {children}
           </main>
         </SidebarInset>
     </Fragment>
   );
});
AppLayoutContent.displayName = 'AppLayoutContent'; // Add display name

// --- Main App Layout Component (now simpler) ---
export function AppLayout({ children }: { children: React.ReactNode }) {
    // This component now mainly provides the TooltipProvider and AppLayoutContent
  return (
       <TooltipProvider delayDuration={0}>
         <AppLayoutContent>{children}</AppLayoutContent>
       </TooltipProvider>
  );
}

// --- Combined imports ---
// (Keep necessary imports from both original and generated sections)
// Make sure all required components and hooks are imported here.
