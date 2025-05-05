
"use client";
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ShoppingCart, CheckCircle } from 'lucide-react'; // Added icons
import { ItemCard } from '@/components/shopping/item-card';
import { useAppContext } from '@/context/app-context';
import type { ShoppingListItem } from '@/context/app-context';
import { AddEditItemModal } from '@/components/shopping/add-edit-item-modal';
import { BudgetPanel } from '@/components/budget/budget-panel';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components

export default function ShoppingListPage() {
  const { state, dispatch, isLoading } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleAddItemClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ShoppingListItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id); // Trigger confirmation dialog
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      dispatch({ type: 'REMOVE_SHOPPING_ITEM', payload: itemToDelete });
      setItemToDelete(null); // Close dialog
    }
  };

  const handleSaveItem = (itemData: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked'>) => {
    if (editingItem) {
      // Update existing item
      dispatch({
        type: 'UPDATE_SHOPPING_ITEM',
        payload: { ...editingItem, ...itemData },
      });
    } else {
      // Add new item
      dispatch({
        type: 'ADD_SHOPPING_ITEM',
        payload: { ...itemData, checked: false }, // Ensure checked is set for new items
      });
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

 const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, index) => ( // Reduced skeleton count
      <CardSkeleton key={index} />
    ))
  );

  const CardSkeleton = () => (
    <Card className="bg-card rounded-lg p-3 w-full border border-border/20 animate-pulse shadow-neon">
        <div className="flex items-center mb-2">
            <Skeleton className="h-5 w-5 rounded mr-3 shrink-0" />
            <div className="flex-grow space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
             <div className="flex space-x-1 ml-auto shrink-0">
             <Skeleton className="h-6 w-6 rounded-md" />
             <Skeleton className="h-6 w-6 rounded-md" />
           </div>
        </div>
        <div className="flex justify-between text-xs mt-1">
             <Skeleton className="h-3 w-1/5" />
             <Skeleton className="h-3 w-1/5" />
             <Skeleton className="h-3 w-1/4" />
        </div>
    </Card>
  );

  const currentItems = useMemo(() => state.shoppingList.filter(item => !item.checked), [state.shoppingList]);
  const purchasedItems = useMemo(() => state.shoppingList.filter(item => item.checked), [state.shoppingList]);

  const renderItemList = (items: ShoppingListItem[], emptyMessage: string) => (
     isLoading ? (
         <div className="flex flex-col gap-2 pb-32 md:pb-24">
            {renderSkeletons()}
         </div>
    ) : items.length === 0 ? (
         <div className="flex items-center justify-center h-full text-center py-10">
            <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
    ) : (
        <div className="flex flex-col gap-2 pb-32 md:pb-24">
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


  return (
    // Use flex-col and h-full to allow content scrolling within the main area
    <div className="flex flex-col h-full">

        {/* Sticky Header Section */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4">
            <BudgetPanel />
             <Tabs defaultValue="current" className="w-full"> {/* Tabs component now inside sticky part, but only TabsList shown */}
                 <TabsList className="grid w-full grid-cols-2 mb-0 bg-card border border-primary/20 shadow-sm"> {/* Removed mb-4 */}
                     <TabsTrigger value="current" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon/30 transition-all">
                         <ShoppingCart className="mr-2 h-4 w-4" /> Current ({currentItems.length})
                     </TabsTrigger>
                     <TabsTrigger value="purchased" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:shadow-neon/30 transition-all">
                         <CheckCircle className="mr-2 h-4 w-4" /> Purchased ({purchasedItems.length})
                     </TabsTrigger>
                 </TabsList>

                 {/* Scrollable Content Area - MUST be outside the sticky div */}
                 {/* The Tabs component wraps the content, but the TabsList is visually sticky above */}
                 <div className="flex-grow overflow-hidden mt-4"> {/* Added margin-top */}
                     <ScrollArea className="h-full pr-1">
                         <TabsContent value="current" className="mt-0"> {/* Removed default margin */}
                             {renderItemList(currentItems, "No current items. Add some!")}
                         </TabsContent>
                         <TabsContent value="purchased" className="mt-0"> {/* Removed default margin */}
                             {renderItemList(purchasedItems, "No items purchased yet.")}
                         </TabsContent>
                     </ScrollArea>
                 </div>
             </Tabs>
        </div>


         {/* Floating Action Button - Stays fixed */}
         <Button
            onClick={handleAddItemClick}
            size="lg"
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-6 md:bottom-8 md:right-8 z-20 rounded-full h-14 w-14 p-0 shadow-neon-lg hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Add new item"
          >
             <PlusCircle className="h-6 w-6" />
         </Button>


        <AddEditItemModal
            isOpen={isModalOpen}
            onClose={() => {
                setIsModalOpen(false);
                setEditingItem(null);
            }}
            onSave={handleSaveItem}
            itemData={editingItem}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
             <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the item from your shopping list.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
