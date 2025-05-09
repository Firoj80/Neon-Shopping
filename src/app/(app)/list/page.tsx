// src/app/(app)/list/page.tsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ShoppingCart, CheckCircle, ListPlus, Lock } from 'lucide-react'; // Added Lock
import { ItemCard } from '@/components/shopping/item-card';
import { useAppContext, FREEMIUM_LIST_LIMIT } from '@/context/app-context'; // Added FREEMIUM_LIST_LIMIT
import type { ShoppingListItem as AppShoppingListItem, List } from '@/context/app-context';
import { AddEditItemModal } from '@/components/shopping/add-edit-item-modal';
import { BudgetCard } from '@/components/budget/budget-panel';
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
import { useRouter } from 'next/navigation';
import CreateFirstListPage from './create-first/page'; 
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


export default function ShoppingListPage() {
  const { state, dispatch, isLoading: contextIsLoading } = useAppContext();
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isLoading = contextIsLoading || authIsLoading;

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppShoppingListItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'purchased'>('current');
  const isClient = useClientOnly();

  const { selectedListId, shoppingListItems, lists, userId: contextUserId, isPremium } = state;
  const currentUserId = user?.id || contextUserId;


   const selectedList: List | undefined = useMemo(() => {
       if (!Array.isArray(lists)) return undefined;
       return lists.find(list => list.id === selectedListId && list.userId === currentUserId);
   }, [lists, selectedListId, currentUserId]);

  const handleAddItemClick = () => {
    if (!selectedListId) {
      console.error("No list selected, cannot add item.");
      // Potentially show a toast or disable button if no list is selected
      return;
    }
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

  const confirmDelete = () => {
    if (itemToDelete) {
      dispatch({ type: 'REMOVE_SHOPPING_ITEM', payload: itemToDelete });
      setItemToDelete(null);
    }
  };

  const handleSaveItem = (itemData: Omit<AppShoppingListItem, 'id' | 'dateAdded' | 'checked' | 'listId' | 'userId'>) => {
    if (!selectedListId || !currentUserId) {
      console.error("[handleSaveItem] Error: No list selected or User ID not available.");
      setIsAddItemModalOpen(false);
      return;
    }
    const listDefaultCategory = selectedList?.defaultCategory || 'uncategorized';
    const finalCategory = itemData.category && state.categories.some(c => c.id === itemData.category)
                            ? itemData.category
                            : listDefaultCategory && state.categories.some(c => c.id === listDefaultCategory)
                              ? listDefaultCategory
                              : 'uncategorized';
    const itemWithFinalDetails: Omit<AppShoppingListItem, 'id' | 'dateAdded' | 'checked'> = {
      ...itemData, listId: selectedListId, userId: currentUserId, category: finalCategory, price: itemData.price ?? 0,
    };
    if (!editingItem) {
      dispatch({ type: 'ADD_SHOPPING_ITEM', payload: itemWithFinalDetails });
    } else {
      const updatePayload: AppShoppingListItem = {
        ...editingItem, ...itemData, listId: selectedListId, userId: currentUserId, category: finalCategory, price: itemData.price ?? 0,
      };
      dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: updatePayload });
    }
    setIsAddItemModalOpen(false);
    setEditingItem(null);
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

  //Skeleton loader
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

   if (!isClient || isLoading) { // Added isLoading check here
       return (
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-1 pb-0 px-1 md:px-0">
                <Skeleton className="h-[88px] w-full rounded-lg mb-2" /> {/* BudgetCard Skeleton */}
                <Skeleton className="h-10 w-full rounded-lg mb-2" /> {/* ListsCarousel Skeleton */}
                <Skeleton className="h-10 w-full rounded-lg" /> {/* TabsList Skeleton */}
            </div>
       );
   }
   
   // Redirect to create-first if authenticated but no lists for the user
   if (isAuthenticated && userLists.length === 0 && pathname !== '/list/create-first') {
        return <CreateFirstListPage />;
   }


  return (
    <div className="flex flex-col h-full">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-1 pb-0 px-1 md:px-0">
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

        <div className="flex-grow overflow-y-auto mt-1 px-1 md:px-0 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {!selectedListId && userLists.length > 0 ? (
            <div className="flex items-center justify-center h-full text-center py-10">
              <p className="text-muted-foreground text-neonText">Please select or create a shopping list.</p>
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
                // Check if trying to add item to a list owned by current user, or if no list selected (which implies creating new one potentially)
                const canProceed = selectedListId ? userLists.some(l => l.id === selectedListId) : true;

                if (!canProceed) {
                     toast({ title: "Error", description: "Cannot add item to this list.", variant: "destructive" });
                     return;
                }
                 handleAddItemClick(); // No premium check for adding items, only for list creation
            }}
            size="lg"
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-6 md:right-8 z-30 rounded-full h-14 w-14 p-0 shadow-neon-lg hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Add new item"
            disabled={!selectedListId || isLoading }
        >
            <PlusCircle className="h-6 w-6" />
        </Button>

        <AddEditItemModal
            isOpen={isAddItemModalOpen}
            onClose={() => { setIsAddItemModalOpen(false); setEditingItem(null); }}
            onSave={handleSaveItem}
            itemData={editingItem}
            currentListId={selectedListId}
        />

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
