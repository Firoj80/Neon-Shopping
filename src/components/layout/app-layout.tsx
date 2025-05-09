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
  FileText, // Renamed ArticleIcon to FileText
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
  SheetContent,
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
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip"; // Added TooltipProvider
import { useClientOnly } from '@/hooks/use-client-only'; // Import the custom hook


// --- Mobile Header Component ---
const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);


  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Left Side: Hamburger Menu Trigger */}
       <Sheet open={isOpen} onOpenChange={setIsOpen}>
         <SheetTrigger asChild> {/* Wrap the Button with SheetTrigger */}
           <Button variant="ghost" size="icon" /* onClick removed, Sheet handles it */ className="mr-2 text-primary hover:text-primary/80 hover:bg-primary/10">
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
         {/* Ensure SidebarSheetContent is rendered within Sheet */}
         <SidebarSheetContent side="left" className="w-[280px] sm:w-[300px]">
            <DesktopSidebarContent onLinkClick={() => setIsOpen(false)} isMobile={true}/>
         </SidebarSheetContent>
       </Sheet>

      {/* Center: App Name/Logo */}
        <Link href="/list" className="flex-grow flex items-center justify-center gap-2 text-lg font-semibold text-primary">
           <ShoppingCart className="w-6 h-6" />
           <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>

      {/* Right Side: Placeholder for potential icons or empty span for spacing */}
      <span className="w-10 h-10"></span> {/* Spacer to help center title */}
    </header>
  );
};

// --- Desktop Sidebar Content (Reusable for Mobile Sheet) ---
interface DesktopSidebarContentProps {
  onLinkClick?: () => void; // Optional: Callback for when a link is clicked (to close mobile sheet)
   isMobile?: boolean; // Flag to know if rendered in mobile sheet
}
const DesktopSidebarContent: React.FC<DesktopSidebarContentProps> = ({ onLinkClick, isMobile = false }) => {
  const pathname = usePathname();
  const appContext = useAppContext(); // Use context if needed for other things
  const router = useRouter();

  const handleLinkClick = useCallback((href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevent default link behavior first
     if (onLinkClick) {
       onLinkClick(); // Close mobile sheet if callback provided
     }
     // Use timeout to allow sheet to close before navigation, preventing layout shifts
     setTimeout(() => {
        router.push(href);
     }, 150); // Adjust delay as needed
  }, [onLinkClick, router]);

   // Define menu items directly within the component or import from a config file
   const primaryMenuItems = [
     { href: '/list', label: 'Shopping List', icon: ShoppingCart },
     { href: '/stats', label: 'Dashboard', icon: LayoutDashboard },
     { href: '/history', label: 'History', icon: History },
     { href: '/settings', label: 'Settings', icon: Settings },
   ];

   const secondaryMenuItems = [
     { href: '/about', label: 'About Us', icon: Info },
     { href: '/contact', label: 'Contact Us', icon: Mail },
     { href: '/privacy', label: 'Privacy Policy', icon: Policy },
     { href: '/terms', label: 'Terms of Service', icon: FileText },
     { href: '/rate', label: 'Rate App', icon: Star },
     { href: '/more-apps', label: 'More Apps', icon: AppsIcon },
   ];

   const renderMenuItem = (item: typeof primaryMenuItems[0]) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={pathname === item.href}
          className={cn(
            "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out",
            "text-neonText hover:text-white",
            pathname === item.href
              ? "bg-primary/20 text-primary border-primary/50 shadow-neon hover:bg-primary/30"
              : "hover:bg-primary/10 hover:border-primary/30 hover:shadow-neon"
          )}
        >
          {isMobile ? (
            <SheetClose asChild>
              <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
              </Link>
            </SheetClose>
          ) : (
            <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
              <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
              <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
   );

  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow flex flex-col">
          {/* Primary Menu */}
          <SidebarMenu className="space-y-1.5 flex-grow">
            {primaryMenuItems.map(renderMenuItem)}
          </SidebarMenu>

          <SidebarSeparator className="my-2" />

          {/* Secondary Menu */}
           <SidebarMenu className="space-y-1.5">
             {secondaryMenuItems.map(renderMenuItem)}
           </SidebarMenu>
      </SidebarContent>
       {/* Removed SidebarFooter related to auth/logout */}
    </>
  );
};


// --- Main AppLayoutContent Component ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Call hooks unconditionally at the top level
    const appContext = useAppContext();
    const router = useRouter();
    const pathname = usePathname();
    const isClientMounted = useClientOnly(); // Hook to ensure client-side execution
    const [isLoading, setIsLoading] = useState(true); // Use a local loading state

    // Handle initial data loading and state syncing
    useEffect(() => {
        setIsLoading(appContext.isLoading); // Sync with context's loading state
    }, [appContext.isLoading]);

    // --- Redirect Logic ---
    // Redirect after ensuring client-side and loading is complete
    useEffect(() => {
      if (isClientMounted && !isLoading) {
        const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;

        // Redirect to create-first page if no lists exist and not already there
        if (!hasLists && pathname !== '/list/create-first') {
           console.log("Redirecting to /list/create-first");
           router.replace('/list/create-first');
        }
         // Redirect to list page if lists exist and currently on create page
         else if (hasLists && pathname === '/list/create-first') {
           console.log("Redirecting to /list");
           router.replace('/list');
         }
      }
    }, [isClientMounted, isLoading, appContext.state.lists, pathname, router]); // Dependencies


    // --- Loading State ---
    if (!isClientMounted || isLoading) {
         // Enhanced loading state
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
            <DesktopSidebarContent />
         </Sidebar>

        {/* Main Content Area */}
         <SidebarInset>
           <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 xl:px-10 xl:py-6 bg-background overflow-y-auto">
              {/* Only render children when client is mounted and not loading */}
              {isClientMounted && !isLoading ? children : null}
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

export default AppLayout;
