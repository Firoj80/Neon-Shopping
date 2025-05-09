"use client";
import React, { useState, useEffect, Fragment } from 'react';
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
  ShieldCheck as PolicyIcon,
  FileText as ArticleIcon,
  Star,
  AppWindow as AppsIcon,
  Menu as MenuIcon, // Renamed Menu to avoid conflict
  X,
  DollarSign, // Added for Currency
  LogOut as LogoutIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
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
  SidebarSheetContent, // Use the custom SidebarSheetContent
} from '@/components/ui/sidebar';
import { useAppContext } from '@/context/app-context';
import ClientOnly from '@/components/client-only';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useClientOnly } from '@/hooks/use-client-only';


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
                {isOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </SheetTrigger>
        <SidebarSheetContent side="left" className="w-[280px] sm:w-[300px]">
          {/* Pass children (the menu content) to SidebarSheetContent */}
          <DesktopSidebarContent onLinkClick={() => setIsOpen(false)} />
        </SidebarSheetContent>
      </Sheet>


      {/* Center: App Name/Logo */}
      <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary mx-auto">
        <ShoppingCart className="w-6 h-6" />
        <ClientOnly><span>Neon Shopping</span></ClientOnly>
      </Link>

      {/* Right Side: Placeholder for potential icons like profile/notifications or empty span for spacing */}
      <span className="w-10 h-10"></span> {/* This acts as a spacer to help center the title */}
    </header>
  );
};

// --- Desktop Sidebar Content (Reusable for Mobile Sheet) ---
interface DesktopSidebarContentProps {
  onLinkClick?: () => void; // Optional: Callback for when a link is clicked (to close mobile sheet)
}
const DesktopSidebarContent: React.FC<DesktopSidebarContentProps> = ({ onLinkClick }) => {
  const pathname = usePathname();
  const appContext = useAppContext();
  const router = useRouter();

  const handleLinkClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onLinkClick) {
      onLinkClick(); // Close mobile sheet if callback provided
    }
    router.push(href);
  };
  
  const menuItems = [
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


  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border shrink-0">
        <Link href="/list" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingCart className="w-6 h-6" />
          <ClientOnly><span>Neon Shopping</span></ClientOnly>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow flex flex-col">
        <SidebarMenu className="space-y-1.5 flex-grow">
          {menuItems.map((item) => (
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
                <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                  <item.icon className={cn("transition-colors", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")} />
                  <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-primary" : "text-sidebar-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarSeparator className="my-2" />

        <SidebarMenu className="space-y-1.5">
           {secondaryMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                 className={cn(
                  "group/menu-item w-full justify-start rounded-md border border-transparent transition-all duration-200 ease-in-out text-xs", // Smaller text for secondary items
                  "text-muted-foreground hover:text-white", // Muted color
                  pathname === item.href
                    ? "bg-secondary/20 text-secondary border-secondary/50 shadow-neon hover:bg-secondary/30"
                    : "hover:bg-secondary/10 hover:border-secondary/30 hover:shadow-neon"
                )}
              >
                <Link href={item.href} onClick={(e) => handleLinkClick(item.href, e)}>
                  <item.icon className={cn("transition-colors h-4 w-4", pathname === item.href ? "text-secondary" : "text-muted-foreground group-hover/menu-item:text-white")} />
                  <span className={cn("transition-colors text-neonText", pathname === item.href ? "text-secondary" : "text-muted-foreground group-hover/menu-item:text-white")}>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {/* Removed SidebarFooter related to auth/logout */}
    </>
  );
};


// --- Main AppLayout Component ---
const AppLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appContext = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const isClientMounted = useClientOnly(); // Use the hook
  const [isLoading, setIsLoading] = useState(true); // Combined loading state

  // Effect for initial loading and redirection logic
   useEffect(() => {
    if (isClientMounted) { // Ensure this runs only on client
      setIsLoading(appContext.isLoading); // Sync with app context's loading state

      if (!appContext.isLoading) { // Only proceed with redirects if app context is done loading
        const hasLists = Array.isArray(appContext.state.lists) && appContext.state.lists.length > 0;
        
        if (!hasLists && pathname !== '/list/create-first') {
          router.replace('/list/create-first');
        } else if (hasLists && pathname === '/list/create-first') {
          router.replace('/list');
        }
      }
    }
  }, [isClientMounted, appContext.isLoading, appContext.state.lists, pathname, router]);


  if (!isClientMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // --- Render full layout ---
  return (
     <Fragment>
       {/* Desktop Sidebar */}
       <Sidebar className="hidden md:flex md:flex-col">
         <DesktopSidebarContent />
       </Sidebar>

       {/* Main Content Area */}
       <SidebarInset>
          {/* Mobile Header - Rendered outside SidebarInset for fixed positioning */}
          <MobileHeader />
          <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 xl:px-10 xl:py-6 bg-background overflow-y-auto">
             <ClientOnly>{children}</ClientOnly>
          </main>
       </SidebarInset>
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

export default AppLayout;
