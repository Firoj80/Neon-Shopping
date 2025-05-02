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
    Array.from({ length: 8 }).map((_, index) => (
      <CardSkeleton key={index} />
    ))
  );

  const CardSkeleton = () => (
    <div className="bg-card rounded-2xl p-4 flex flex-col min-h-[120px] border border-border/20">
      <div className="flex items-start space-x-3 mb-2">
        <Skeleton className="h-5 w-5 rounded mt-1" />
        <Skeleton className="h-4 w-3/4 mt-1" />
      </div>
      <div className="space-y-2 pl-7 mt-auto">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
         <Skeleton className="h-3 w-2/5" />
      </div>
       <div className="p-2 border-t border-border/20 flex justify-end space-x-1 mt-2">
         <Skeleton className="h-7 w-7 rounded-md" />
         <Skeleton className="h-7 w-7 rounded-md" />
       </div>
    </div>
  );


  return (
    <div className="flex flex-col h-full">
        <BudgetPanel />

        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Shopping List</h1>
            <Button onClick={handleAddItemClick} className="shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
        </div>

        {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-grow">
                {renderSkeletons()}
             </div>
        ) : state.shoppingList.length === 0 ? (
             <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-center">Your shopping list is empty. Add some items!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-grow">
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
