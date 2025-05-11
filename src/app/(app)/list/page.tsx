// src/app/(app)/list/page.tsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ShoppingCart, CheckCircle, ListPlus } from 'lucide-react';
import { ItemCard } from '@/components/shopping/item-card';
import { useAppContext, FREEMIUM_LIST_LIMIT } from '@/context/app-context';
import type { ShoppingListItem as AppShoppingListItem, List } from '@/context/app-context';
import { AddEditItemModal } from '@/components/shopping/add-edit-item-modal';
import { BudgetCard, BudgetCardSkeleton } from '@/components/budget/budget-panel';
import { ListsCarousel } from '@/components/list/ListsCarousel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientOnly from '@/components/client-only';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { useClientOnly } from '@/hooks/use-client-only';
import { useRouter, usePathname } from 'next/navigation';
// Removed import of CreateFirstListPage as AppLayoutContent handles initial redirection
// import { useAuth } from '@/context/auth-context'; // Removed Auth import
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs if not using API

const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_LIST_ROUTE = '/list'; // Define this if not already available

export default function ShoppingListPage() {
  const { state: appState, dispatch, isLoading: appContextIsLoading } = useAppContext();
  // const { user, isAuthenticated, isLoading: authIsLoading } = useAuth(); // Removed Auth
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = appContextIsLoading; // Simplified loading state
  const isClientMounted = useClientOnly();


  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppShoppingListItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'purchased'>('current');


  const { selectedListId, shoppingListItems, lists, userId: contextUserId, isPremium } = appState;
  const currentUserId = contextUserId; // Directly use contextUserId


   const selectedList: List | undefined = useMemo(() => {
       if (!Array.isArray(lists) || !currentUserId) return undefined;
       return lists.find(list => list.id === selectedListId && list.userId === currentUserId);
   }, [lists, selectedListId, currentUserId]);

  const handleAddItemClick = () => {
    if (!selectedListId) {
      toast({
        title: "No List Selected",
        description: "Please select or create a list before adding items.",
        variant: "destructive"
      });
      return;
    }
    // No authentication check needed for local storage version
    setEditingItem(null);
    setIsAddItemModalOpen(true);
  };

  const handleEditItem = (item: AppShoppingListItem) => {
    setEditingItem(item);
    setIsAddItemModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => { // Removed async as no API call
    if (itemToDelete && currentUserId) {
      // Local storage version: dispatch directly
      dispatch({ type: 'REMOVE_SHOPPING_ITEM', payload: itemToDelete });
      toast({ title: "Success", description: "Item removed." });
      setItemToDelete(null);
    }
  };


  const userLists = useMemo(() => {
    if (!Array.isArray(lists) || !currentUserId) return [];
    return lists.filter(list => list.userId === currentUserId);
  }, [lists, currentUserId]);


  const itemsForSelectedList = useMemo(() => {
    if (!selectedListId || !Array.isArray(shoppingListItems) || !currentUserId) return [];
    return shoppingListItems.filter(item => item.listId === selectedListId && item.userId === currentUserId);
  }, [selectedListId, shoppingListItems, currentUserId]);

  const currentItems = useMemo(() => itemsForSelectedList.filter(item => !item.checked), [itemsForSelectedList]);
  const purchasedItems = useMemo(() => itemsForSelectedList.filter(item => item.checked), [itemsForSelectedList]);

  // Redirect to create-first if authenticated, no lists, and not already on create-first
  useEffect(() => {
    if (isClientMounted && !isLoading && userLists.length === 0 && pathname !== CREATE_FIRST_LIST_ROUTE) {
      console.log("ShoppingListPage: No lists, redirecting to create-first.");
      router.replace(CREATE_FIRST_LIST_ROUTE);
    }
  }, [isClientMounted, isLoading, userLists, pathname, router]);


  const CardSkeleton = () => (
     <Card className="bg-card rounded-lg p-3 w-full border border-border/20 animate-pulse shadow-neon glow-border-inner">
        <div className="flex items-center">
            <Skeleton className="h-5 w-5 rounded mr-3 shrink-0" />
             <div className="flex-grow min-w-0">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-x-2 text-xs text-muted-foreground mt-1.5">
                   <Skeleton className="h-3 w-1/6" />
                   <Skeleton className="h-3 w-1/4" />
                   <Skeleton className="h-3 w-1/5" />
                   <Skeleton className="h-4 w-1/5 rounded-full" />
                </div>
            </div>
           <div className="flex space-x-1 ml-auto shrink-0">
             <Skeleton className="h-6 w-6 rounded-md" />
             <Skeleton className="h-6 w-6 rounded-md" />
           </div>
        </div>
    </Card>
  );
  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)
  );

 const renderItemList = (items: AppShoppingListItem[], emptyMessage: string) => (
     isLoading && itemsForSelectedList.length === 0 ? (
         <div className="flex flex-col gap-2 pb-4">
            {renderSkeletons()}
         </div>
    ) : items.length === 0 ? (
         <div className="flex items-center justify-center h-full text-center py-10 min-h-[100px]">
            <p className="text-muted-foreground text-neonText">{emptyMessage}</p>
        </div>
    ) : (
        <div className="flex flex-col gap-2 pb-4">
            {items.map((item) => (
                <ItemCard key={item.id} item={item} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            ))}
        </div>
    )
  );

   if (!isClientMounted || isLoading) {
       return (
         <div className="flex flex-col h-full">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-1 pb-0 px-1 md:px-0">
                <BudgetCardSkeleton/>
                <Skeleton className="h-10 w-full rounded-lg mb-2" /> 
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>
             <div className="flex-grow overflow-y-auto mt-1 px-1 md:px-0 pb-[calc(6rem+env(safe-area-inset-bottom))]">
                {renderSkeletons()}
            </div>
         </div>
       );
   }

   if (userLists.length === 0 && pathname === DEFAULT_LIST_ROUTE) {
     // This case should be handled by the useEffect redirecting to CREATE_FIRST_LIST_ROUTE
     // If it reaches here, it implies a slight delay or race condition.
     // A minimal placeholder can be shown or simply let the redirect handle it.
     return (
       <div className="flex items-center justify-center h-screen">
         <p className="text-muted-foreground">Loading your lists...</p>
       </div>
     );
   }


  return (
    <div className="flex flex-col h-full">
        {/* Sticky Header: Budget, Lists Carousel, Tabs */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pt-1 pb-0 px-1 md:px-0">
            <BudgetCard />
            <ListsCarousel />
            <ClientOnly>
               <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'current' | 'purchased')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-card border border-primary/20 shadow-sm glow-border-inner mt-2">
                        <TabsTrigger value="current" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon/30 transition-all">
                            <ShoppingCart className="mr-2 h-4 w-4" /> Current ({currentItems.length})
                        </TabsTrigger>
                        <TabsTrigger value="purchased" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:shadow-neon/30 transition-all">
                            <CheckCircle className="mr-2 h-4 w-4" /> Purchased ({purchasedItems.length})
                        </TabsTrigger>
                    </TabsList>
               </Tabs>
            </ClientOnly>
        </div>

        {/* Scrollable Item List Area */}
        <div className="flex-grow overflow-y-auto mt-1 px-1 md:px-0 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {(!selectedListId && userLists.length > 0) || (userLists.length === 0 && !isLoading)? (
            <div className="flex items-center justify-center h-full text-center py-10">
              <p className="text-muted-foreground text-neonText">
                {userLists.length === 0 ? "Create your first list to get started!" : "Please select or create a shopping list."}
              </p>
            </div>
           ) : (
             <ClientOnly>
                 <Tabs value={activeTab} className="w-full">
                     <TabsContent value="current" className="mt-0 pt-2">
                         {renderItemList(currentItems, "No current items in this list. Add some!")}
                     </TabsContent>
                     <TabsContent value="purchased" className="mt-0 pt-2">
                         {renderItemList(purchasedItems, "No items purchased in this list yet.")}
                     </TabsContent>
                 </Tabs>
             </ClientOnly>
           )}
        </div>

        <Button
            onClick={() => {
                 if (!selectedListId) {
                     toast({
                         title: "No List Selected",
                         description: "Please select or create a list first.",
                         variant: "default",
                     });
                     return;
                 }
                 // No auth check needed for local storage version
                 handleAddItemClick();
            }}
            size="lg"
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-6 md:right-8 z-30 rounded-full h-14 w-14 p-0 shadow-neon-lg hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Add new item"
            disabled={isLoading || (!selectedListId && userLists.length > 0) }
        >
            <PlusCircle className="h-6 w-6" />
        </Button>

        {currentUserId && selectedListId && (
            <AddEditItemModal
                isOpen={isAddItemModalOpen}
                onClose={() => { setIsAddItemModalOpen(false); setEditingItem(null); }}
                itemData={editingItem}
                currentListId={selectedListId}
            />
        )}

        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent className="glow-border">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the item from this shopping list.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)} className="glow-border-inner">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-border-inner">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
