
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ShoppingCart, CheckCircle, ListPlus } from 'lucide-react';
import { ItemCard } from '@/components/shopping/item-card';
import { useAppContext } from '@/context/app-context';
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
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { useRouter } from 'next/navigation'; // Import useRouter
import CreateFirstListPage from './create-first/page'; // Corrected import path


export default function ShoppingListPage() {
  const { state, dispatch, isLoading: isAppLoading } = useAppContext();
  const { user, isLoading: isAuthLoading } = useAuth(); // Get auth state including user
  const router = useRouter(); // Get router

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppShoppingListItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const isClient = useClientOnly(); // Hook to ensure client-side execution

  const { selectedListId, shoppingListItems, lists } = state;

  // Combined loading state
  const isLoading = isAppLoading || isAuthLoading;

  const selectedList: List | undefined = useMemo(() => {
      if (!Array.isArray(lists)) return undefined;
      return lists.find(list => list.id === selectedListId);
  }, [lists, selectedListId]);

  const handleAddItemClick = () => {
    if (!selectedListId) {
        console.error("No list selected, cannot add item.");
        // Optionally show a toast message here
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

    // **Stricter Checks and Logging**
    if (!selectedListId) {
        console.error("[handleSaveItem] Error: No list selected (selectedListId is null). Cannot save item.");
        setIsAddItemModalOpen(false);
        return;
    }

    if (!user || !user.id) {
      console.error("[handleSaveItem] Error: User not authenticated (user or user.id is null/undefined). Cannot save item.");
      setIsAddItemModalOpen(false);
      return;
    }
    // **End Stricter Checks**

    const listDefaultCategory = selectedList?.defaultCategory || 'uncategorized';
    const finalCategory = itemData.category || listDefaultCategory;

    // Construct the payload with listId and userId
     const itemWithFinalDetails: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked'> = {
      ...itemData,
      listId: selectedListId, // We've confirmed selectedListId is not null
      userId: user.id,        // We've confirmed user.id is not null
      category: finalCategory,
    };

    // Log right before dispatching ADD
    if (!editingItem) {
        console.log("[handleSaveItem] Dispatching ADD_SHOPPING_ITEM with payload:", itemWithFinalDetails);
        if (!itemWithFinalDetails.listId || !itemWithFinalDetails.userId) {
             console.error("[handleSaveItem] CRITICAL ERROR: listId or userId became null/undefined right before dispatching ADD!");
             setIsAddItemModalOpen(false);
             setEditingItem(null);
             return;
        }
        dispatch({
            type: 'ADD_SHOPPING_ITEM',
            payload: itemWithFinalDetails,
        });
    } else {
         // Ensure the update payload includes all required fields
         const updatePayload: AppShoppingListItem = {
           ...editingItem, // Start with the existing item
           ...itemData, // Apply changes from the modal
           listId: selectedListId, // Ensure listId is correct
           userId: user.id,        // Ensure userId is correct
           category: finalCategory, // Apply potentially updated category
           price: itemData.price ?? 0, // Ensure price is a number
         };
         console.log("[handleSaveItem] Dispatching UPDATE_SHOPPING_ITEM with payload:", updatePayload);
        if (!updatePayload.listId || !updatePayload.userId) {
            console.error("[handleSaveItem] CRITICAL ERROR: listId or userId became null/undefined right before dispatching UPDATE!");
            setIsAddItemModalOpen(false);
            setEditingItem(null);
            return;
        }
        dispatch({
            type: 'UPDATE_SHOPPING_ITEM',
            payload: updatePayload,
        });
    }

    setIsAddItemModalOpen(false);
    setEditingItem(null);
  };

  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <CardSkeleton key={index} />
    ))
  );

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

  const itemsForSelectedList = useMemo(() => {
    if (!selectedListId || !Array.isArray(shoppingListItems)) return [];
    return shoppingListItems.filter(item => item.listId === selectedListId);
  }, [selectedListId, shoppingListItems]);

  const currentItems = useMemo(() => itemsForSelectedList.filter(item => !item.checked), [itemsForSelectedList]);
  const purchasedItems = useMemo(() => itemsForSelectedList.filter(item => item.checked), [itemsForSelectedList]);

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
                <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                />
            ))}
        </div>
    )
  );

  // --- Loading and Authentication Checks ---
  if (!isClient || isLoading) {
     // Show loader while hydrating, loading auth state, or loading app data
     return (
       <div className="flex items-center justify-center h-screen">
         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
       </div>
     );
  }

   // Check if there are no lists AFTER loading is complete and client is mounted
  if (isClient && !isLoading && lists.length === 0) {
    return <CreateFirstListPage />;
  }


  // --- Render the main shopping list UI ---
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem))]"> {/* Adjust height calculation */}
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pt-1 pb-0 px-4 md:px-6 lg:px-8 xl:px-10"> {/* Use consistent padding */}
            <BudgetCard />
            <ListsCarousel />
            <ClientOnly>
                <Tabs value={state.selectedListId ? 'current' : undefined} className="w-full"> {/* Manage Tabs value */}
                    <TabsList className="grid w-full grid-cols-2 bg-card border border-primary/20 shadow-sm glow-border-inner mt-2">
                        <TabsTrigger value="current" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon/30 transition-all">
                            <ShoppingCart className="mr-2 h-4 w-4" /> Current ({currentItems.length})
                        </TabsTrigger>
                        <TabsTrigger value="purchased" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:shadow-neon/30 transition-all">
                            <CheckCircle className="mr-2 h-4 w-4" /> Purchased ({purchasedItems.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Scrollable Item List Area */}
                    <div className="flex-grow overflow-y-auto mt-1 pb-[calc(5rem+env(safe-area-inset-bottom))]"> {/* Adjust padding-bottom */}
                      {!selectedListId && Array.isArray(lists) && lists.length > 0 ? (
                        <div className="flex items-center justify-center h-full text-center py-10">
                          <p className="text-muted-foreground text-neonText">Please select or create a shopping list.</p>
                        </div>
                      ) : (
                         <>
                            <TabsContent value="current" className="mt-0 pt-2">
                                {renderItemList(currentItems, "No current items in this list. Add some!")}
                            </TabsContent>
                            <TabsContent value="purchased" className="mt-0 pt-2">
                                {renderItemList(purchasedItems, "No items purchased in this list yet.")}
                            </TabsContent>
                         </>
                      )}
                    </div>
                </Tabs>
            </ClientOnly>
        </div>

        {/* Add Item Floating Action Button */}
        <Button
            onClick={handleAddItemClick}
            size="lg"
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-6 md:right-8 z-30 rounded-full h-14 w-14 p-0 shadow-neon-lg hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Add new item"
            disabled={!selectedListId || isLoading} // Also disable if loading
        >
            <PlusCircle className="h-6 w-6" />
        </Button>

        {/* Modals */}
        <AddEditItemModal
            isOpen={isAddItemModalOpen}
            onClose={() => {
                setIsAddItemModalOpen(false);
                setEditingItem(null);
            }}
            onSave={handleSaveItem}
            itemData={editingItem}
            currentListId={selectedListId} // Pass current list ID
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


    