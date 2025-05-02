
"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

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
    Array.from({ length: 5 }).map((_, index) => (
      <CardSkeleton key={index} />
    ))
  );

  // Updated skeleton for list view
  const CardSkeleton = () => (
    <Card className="bg-card rounded-lg p-3 flex items-center w-full border border-border/20 animate-pulse">
        <Skeleton className="h-5 w-5 rounded mr-3 shrink-0" />
        <div className="flex-grow space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex space-x-4 text-xs">
                <Skeleton className="h-3 w-1/6" />
                <Skeleton className="h-3 w-1/6" />
                <Skeleton className="h-3 w-1/5" />
            </div>
        </div>
        <div className="flex space-x-1 ml-auto shrink-0">
         <Skeleton className="h-7 w-7 rounded-md" />
         <Skeleton className="h-7 w-7 rounded-md" />
       </div>
    </Card>
  );


  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem)-var(--footer-height,4rem)-2rem)] relative"> {/* Adjust height based on header/footer */}
        <BudgetPanel />

        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-secondary">Your Items</h2>
            {/* Button is moved below */}
        </div>

        {/* Wrap the list in ScrollArea */}
        <ScrollArea className="flex-grow pr-4 -mr-4 mb-16"> {/* Add padding bottom for FAB */}
             {isLoading ? (
                 <div className="flex flex-col gap-2">
                    {renderSkeletons()}
                 </div>
            ) : state.shoppingList.length === 0 ? (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center py-10">Your shopping list is empty. Add some items!</p>
                </div>
            ) : (
                // Use flex column for list view
                <div className="flex flex-col gap-2">
                {state.shoppingList.map((item) => (
                    <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    />
                ))}
                </div>
            )}
        </ScrollArea>

         {/* Floating Action Button */}
         <Button
            onClick={handleAddItemClick}
            size="lg" // Make it larger
            className="fixed bottom-20 right-6 z-10 rounded-full h-14 w-14 p-0 shadow-neon-lg hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 text-primary-foreground" // Use theme colors
            aria-label="Add new item"
          >
             <PlusCircle className="h-6 w-6" />
         </Button>


        <AddEditItemModal
            isOpen={isModalOpen}
            onClose={() => {
                setIsModalOpen(false);
                setEditingItem(null); // Clear editing state when closing
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
