"use client";

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  LayoutDashboard,
  History,
  Settings,
  Palette, // Added for Themes
  Info,
  Mail,
  ShieldCheck as Policy, // Renamed ShieldCheck to Policy
  FileText as ArticleIcon, // Renamed FileText to Article
  Star,
  AppWindow as AppsIcon, // Corrected AppsIcon to AppWindow
  Menu as MenuIcon, // Renamed Menu to avoid conflict
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent // Import SheetContent
} from "@/components/ui/sheet"; // Keep Sheet related imports
import {
  // Removed SidebarProvider import as it's no longer used
  // Removed useSidebar import as it's no longer used
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
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip"; // Added TooltipProvider
// Removed import { useClientOnly } from '@/hooks/use-client-only';


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // Local state for sheet

  return (
    // Use flex with justify-between initially, but center the title with a placeholder
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger asChild> {/* Wrap the Button with SheetTrigger */}
           <Button variant="ghost" size="icon" className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
             {/* Wrap the animated icon in a span */}
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
         {/* Mobile Sidebar Content using SheetContent */}
         <SidebarSheetContent side="left" className="w-[280px]">
             {/* Render the menu content within the mobile sheet */}
              <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
                 {/* Use SheetClose to close the sheet when clicking the link */}
                 {/* SheetClose should wrap the element that triggers the close */}
                 <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <ShoppingCart className="w-6 h-6" />
                    <ClientOnly><span>Neon Shopping</span></ClientOnly>
                 </Link>
             </SidebarHeader>
             <SidebarContent className="p-2 flex flex-col flex-grow overflow-y-auto">
                  {/* Pass isMobileSheet prop as true */}
                  <MainMenuContent onNavigate={() => setIsOpen(false)} isMobileSheet={true} />
             </SidebarContent>
             <SidebarFooter className="p-2 border-t border-sidebar-border">
                 <hr className="my-3 border-sidebar-border/50" />
                 <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
             </SidebarFooter>
         </SidebarSheetContent>
       </Sheet>

      {/* Center: App Name/Logo */}
       <div className="flex-grow flex items-center justify-center"> {/* Added flex and justify-center */}
          <Link href="/list" className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
            <ShoppingCart className="w-6 h-6" />
             <ClientOnly><span>Neon Shopping</span></ClientOnly>
          </Link>
        </div>

      {/* Right Side: Placeholder to balance the layout */}
      <div className="w-10 h-10 flex-shrink-0"></div> {/* Matches the width of the trigger button */}
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
    { href: '/themes', label: 'Themes', icon: Palette }, // Added Themes
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Policy }, // Corrected variable name
    { href: '/terms', label: 'Terms of Service', icon: ArticleIcon }, // Corrected variable name
    { href: '/rate', label: 'Rate App', icon: Star },
    { href: '/more-apps', label: 'More Apps', icon: AppsIcon }, // Corrected variable name
];


// --- Main Menu Content Component ---
interface MainMenuContentProps {
    onNavigate?: () => void;
    isMobileSheet?: boolean; // New prop
}
const MainMenuContent: React.FC<MainMenuContentProps> = ({ onNavigate, isMobileSheet = false }) => { // Default to false
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
        onNavigate(); // Call the callback to close the sheet
      }
      // Allow default navigation
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
                 {/* Use SheetClose conditionally only within the mobile sheet */}
                 {isMobileSheet ? (
                     <SheetClose asChild>
                         <SidebarMenuButton
                             asChild
                             isActive={isItemActive(item.href)}
                             tooltip={item.label}
                             className={cn(menuItemClasses, isItemActive(item.href) && activeItemClasses)}
                         >
                             {/* Link content needs to be directly inside for asChild */}
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
         <div className="flex flex-col flex-grow"> {/* Ensure content takes available space */}
             <SidebarMenu className="space-y-1.5 flex-grow overflow-y-auto"> {/* Added overflow-y-auto */}
                 {renderMenuItems(primaryMenuItems)}
                 <SidebarSeparator className="my-2" />
                 {renderMenuItems(secondaryMenuItems)}
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
  const { isLoading } = appContext;
  const isClientMounted = typeof window !== 'undefined'; // Simple client check


  // --- Loading State ---
  // Show loader if not mounted or still loading initial data
  if (!isClientMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

   // --- Redirect Logic ---
   // Redirect after ensuring client-side and loading is complete
   useEffect(() => {
     if (isClientMounted && !isLoading) {
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
   }, [isClientMounted, isLoading, appContext.state.lists, pathname, router]);

   // If redirecting, show loader (this prevents rendering the wrong page briefly)
    const isRedirecting = (!isLoading && Array.isArray(appContext.state.lists) && appContext.state.lists.length === 0 && pathname !== '/list/create-first') ||
                         (!isLoading && Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0 && pathname === '/list/create-first');

    if (isRedirecting) {
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
             {/* Render the menu content within the desktop sidebar (isMobileSheet is false by default) */}
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


// --- Cleaned up legacy/duplicate imports ---
// Removed imports that are already defined above or no longer needed
// For example, BudgetCard, ListsCarousel, etc. are likely imported within the pages that use them.
// Icons like WalletCards, Trash2, Edit2, Banknote, etc. are likely used within specific components, not the main layout.

// Ensure only necessary imports remain for the AppLayout structure itself.
// Removed duplicate imports like CheckCircle, PanelLeftIcon etc. if they were defined above.
// Removed AppLayoutWithProviders as it's combined now.
// Removed BudgetCardSkeleton if not used directly here.
// Removed useApp alias if useAppContext is used directly.
// Removed Toaster import if handled elsewhere (e.g., in Providers).
// Removed unused useState, useEffect etc. if logic moved.
// Removed DropdownMenu imports if profile dropdown is removed.
// Removed unused LogoutIcon, Profile icons.
// Removed useClientOnly if simple check is sufficient.
// Removed Settings icon if handled in secondaryMenuItems
// Removed DollarSign if handled in Currency page
// Removed Policy, Article if handled in secondaryMenuItems
// Removed Cart, DashboardIcon if handled in primaryMenuItems
// Removed PanelLeft if MenuIcon/X handles toggle
// Removed Palette if handled in secondaryMenuItems
// Removed BarChart3, LineChartIcon, Download, History, TrendingUp, Wallet, CalendarDays if only used in Stats/History pages
// Removed Layers if only used in Settings/Stats
// Removed Grid if not used
// Removed PlusCircle if Add button is handled in List page
// Removed specific rename aliases if the original names are clear (like Policy/ArticleIcon/AppsIcon) unless needed for clarity
