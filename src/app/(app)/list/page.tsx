"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';
import { ItemCard } from '@/components/shopping/item-card';
import { useAppContext } from '@/context/app-context';
import type { ShoppingListItem as AppShoppingListItem } from '@/context/app-context'; // Renamed to avoid conflict
import { AddEditItemModal } from '@/components/shopping/add-edit-item-modal';
import { BudgetCard } from '@/components/budget/budget-panel'; // Renamed import
import { ListsCarousel } from '@/components/list/ListsCarousel'; // New component
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

export default function ShoppingListPage() {
  const { state, dispatch, isLoading } = useAppContext();
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppShoppingListItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { selectedListId, shoppingListItems } = state;

  const handleAddItemClick = () => {
    if (!selectedListId) {
        // Optionally, prompt user to select or create a list first
        alert("Please select or create a list before adding items.");
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
      // TODO: Firebase - deleteItemFromFirestore(itemToDelete);
      setItemToDelete(null);
    }
  };

  const handleSaveItem = (itemData: Omit<AppShoppingListItem, 'id' | 'dateAdded' | 'checked' | 'listId'>) => {
    if (!selectedListId) {
        console.error("No list selected, cannot save item.");
        setIsAddItemModalOpen(false);
        return;
    }

    if (editingItem) {
      dispatch({
        type: 'UPDATE_SHOPPING_ITEM',
        payload: { ...editingItem, ...itemData },
      });
      // TODO: Firebase - updateItemInFirestore({ ...editingItem, ...itemData });
    } else {
      dispatch({
        type: 'ADD_SHOPPING_ITEM',
        payload: { ...itemData, listId: selectedListId, checked: false },
      });
      // TODO: Firebase - addItemToFirestore({ ...itemData, listId: selectedListId, checked: false });
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
    if (!selectedListId) return [];
    return shoppingListItems.filter(item => item.listId === selectedListId);
  }, [selectedListId, shoppingListItems]);

  const currentItems = useMemo(() => itemsForSelectedList.filter(item => !item.checked), [itemsForSelectedList]);
  const purchasedItems = useMemo(() => itemsForSelectedList.filter(item => item.checked), [itemsForSelectedList]);

  const renderItemList = (items: AppShoppingListItem[], emptyMessage: string) => (
     isLoading && itemsForSelectedList.length === 0 ? ( // Show skeleton only if loading and no items yet for selected list
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

  if (isLoading && state.lists.length === 0) { // Initial app load skeleton
    return (
        <div className="flex flex-col h-full gap-4">
            <BudgetCardSkeleton />
            <Skeleton className="h-24 w-full rounded-lg" /> {/* Lists Carousel Skeleton */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* TabsList Skeleton */}
            <div className="flex-grow overflow-y-auto">
                {renderSkeletons()}
            </div>
        </div>
    )
  }


  return (
    <div className="flex flex-col h-full">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-0 pt-2"> {/* Reduced pb */}
            <BudgetCard />
            <ListsCarousel />
            <ClientOnly>
                <TabsList className="grid w-full grid-cols-2 bg-card border border-primary/20 shadow-sm glow-border-inner mt-3"> {/* Added mt-3 */}
                    <TabsTrigger value="current" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon/30 transition-all">
                        <ShoppingCart className="mr-2 h-4 w-4" /> Current ({currentItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="purchased" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:shadow-neon/30 transition-all">
                        <CheckCircle className="mr-2 h-4 w-4" /> Purchased ({purchasedItems.length})
                    </TabsTrigger>
                </TabsList>
            </ClientOnly>
        </div>

        <div className="flex-grow overflow-y-auto mt-1"> {/* Added mt-1 */}
          {!selectedListId && !isLoading ? (
            <div className="flex items-center justify-center h-full text-center py-10">
                <p className="text-muted-foreground text-neonText">Please select or create a shopping list to view items.</p>
            </div>
            ) : (
            <ClientOnly>
                 <TabsContent value="current" className="mt-0 pt-2">
                    {renderItemList(currentItems, "No current items in this list. Add some!")}
                 </TabsContent>
                 <TabsContent value="purchased" className="mt-0 pt-2">
                    {renderItemList(purchasedItems, "No items purchased in this list yet.")}
                 </TabsContent>
            </ClientOnly>
            )}
        </div>

         <Button
            onClick={handleAddItemClick}
            size="lg"
            className="fixed bottom-[calc(50px+1.5rem+env(safe-area-inset-bottom))] right-6 md:bottom-[calc(50px+2rem+env(safe-area-inset-bottom))] md:right-8 z-20 rounded-full h-14 w-14 p-0 shadow-neon-lg hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Add new item"
            disabled={!selectedListId || isLoading} // Disable if no list selected or loading
          >
             <PlusCircle className="h-6 w-6" />
         </Button>

        <AddEditItemModal
            isOpen={isAddItemModalOpen}
            onClose={() => {
                setIsAddItemModalOpen(false);
                setEditingItem(null);
            }}
            onSave={handleSaveItem}
            itemData={editingItem}
            // Pass selectedListId if your modal needs it directly,
            // or rely on it being set in the handleSaveItem function from context
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
