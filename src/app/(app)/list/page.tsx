// src/app/(app)/list/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { ShoppingListItem as AppShoppingListItem, List, Category } from '@/context/app-context';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep Label for potential future use
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from '@/components/shopping/item-card';
import { PlusCircle, Search, LayoutList, ShoppingCart } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { useClientOnly } from '@/hooks/use-client-only';
// Removed CreateFirstListPage import

export default function ShoppingListPage() {
  const { state, dispatch, isLoading } = useAppContext(); // Removed isInitialDataLoaded, isLoading from AppContext is sufficient
  const { lists, selectedListId, shoppingListItems, currency, categories, userId } = state;

  const [showAddEditItemModal, setShowAddEditItemModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<AppShoppingListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AppShoppingListItem | null>(null);
  const [showAddEditListModal, setShowAddEditListModal] = useState(false);
  const [listToEdit, setListToEdit] = useState<List | null>(null);
  
  const isClient = useClientOnly();

  const selectedList = useMemo(() => {
    return lists.find(list => list.id === selectedListId);
  }, [lists, selectedListId]);

  const itemsForSelectedList = useMemo(() => {
    if (!selectedListId) return [];
    return shoppingListItems.filter(item => item.listId === selectedListId);
  }, [shoppingListItems, selectedListId]);

  const currentItems = useMemo(() => {
    return itemsForSelectedList.filter(item => !item.checked && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [itemsForSelectedList, searchTerm]);

  const purchasedItems = useMemo(() => {
    return itemsForSelectedList.filter(item => item.checked && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [shoppingListItems, searchTerm]);


  const handleAddItemClick = () => {
    if (!selectedListId || !userId) { // Ensure userId is available
      console.error("Cannot add item: No list selected or user ID missing.");
      return;
    }
    setItemToEdit(null);
    setShowAddEditItemModal(true);
  };

  const handleEditItem = (item: AppShoppingListItem) => {
    setItemToEdit(item);
    setShowAddEditItemModal(true);
  };

  const handleDeleteItem = (item: AppShoppingListItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      dispatch({ type: 'DELETE_SHOPPING_ITEM', payload: itemToDelete.id });
    }
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleSelectList = (listId: string) => {
    dispatch({ type: 'SELECT_LIST', payload: listId });
  };

  const handleCreateNewList = () => {
    if (!userId) {
      console.error("Cannot create new list: User ID missing.");
      return;
    }
    setListToEdit(null);
    setShowAddEditListModal(true);
  };
  
  const handleEditList = (list: List) => {
    setListToEdit(list);
    setShowAddEditListModal(true);
  };
  
  if (!isClient || isLoading || !state.isInitialDataLoaded) { // Use state.isInitialDataLoaded
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
            <ShoppingCart className="w-16 h-16 animate-pulse text-primary" />
            <p className="mt-4 text-lg font-semibold">Loading Your Shopping Space...</p>
        </div>
      </div>
    );
  }
  
  // AppLayout now handles redirection to /list/create-first if no lists exist.
  // This page should only render if lists DO exist or if there was an issue with redirect.
  if (lists.length === 0 && !isLoading) {
     return (
        <div className="flex items-center justify-center h-screen">
            <p>No lists found. You should be redirected to create one.</p>
        </div>
     );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background pt-4"> {/* Sticky container for Budget and Tabs */}
        <BudgetCard
          list={selectedList}
          items={itemsForSelectedList}
          currency={currency}
          onEditBudget={() => selectedList && handleEditList(selectedList)}
        />

        <ListsCarousel
            lists={lists}
            selectedListId={selectedListId}
            onSelectList={handleSelectList}
            onAddNewList={handleCreateNewList}
            onEditList={handleEditList}
            isPremium={state.isPremium} // Will be false, but kept for prop consistency
        />
        
        <div className="relative mt-2 mb-2"> {/* Reduced margin */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/30 focus:border-primary focus:shadow-neon"
            />
        </div>

        <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-2 bg-card border border-primary/20 shadow-sm"> {/* Reduced margin */}
            <TabsTrigger value="current" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon-sm transition-all">
                Current ({currentItems.length})
            </TabsTrigger>
            <TabsTrigger value="purchased" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon-sm transition-all">
                Purchased ({purchasedItems.length})
            </TabsTrigger>
            </TabsList>
        </Tabs>
      </div>
      
      {/* Scrollable Item Area */}
      <ScrollArea className="flex-grow mt-1"> {/* ScrollArea takes up remaining space */}
        <Tabs defaultValue="current" className="w-full">
          {/* TabsList is part of the sticky section above, so it's not repeated here */}
          <TabsContent value="current" className="mt-0">
            {currentItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <LayoutList className="mx-auto h-12 w-12 mb-2" />
                No current items. Add some!
              </div>
            ) : (
              <div className="space-y-2 pb-20"> {/* Added padding-bottom */}
                {currentItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    currency={currency}
                    categories={categories}
                    onEdit={() => handleEditItem(item)}
                    onDelete={() => handleDeleteItem(item)}
                    onToggleChecked={() => dispatch({ type: 'TOGGLE_ITEM_CHECKED', payload: item.id })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="purchased" className="mt-0">
            {purchasedItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ShoppingCart className="mx-auto h-12 w-12 mb-2" />
                 No items purchased yet.
              </div>
            ) : (
              <div className="space-y-2 pb-20"> {/* Added padding-bottom */}
                {purchasedItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    currency={currency}
                    categories={categories}
                    onEdit={() => handleEditItem(item)}
                    onDelete={() => handleDeleteItem(item)}
                    onToggleChecked={() => dispatch({ type: 'TOGGLE_ITEM_CHECKED', payload: item.id })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {selectedListId && (
        <Button
            onClick={handleAddItemClick}
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6 z-20 rounded-full h-14 w-14 p-0 shadow-neon-lg bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
            aria-label="Add new item"
            disabled={!selectedListId} 
        >
            <PlusCircle className="h-7 w-7" />
        </Button>
      )}

      {showAddEditItemModal && selectedList && userId && (
        <AddEditItemModal
          isOpen={showAddEditItemModal}
          onClose={() => setShowAddEditItemModal(false)}
          itemToEdit={itemToEdit}
          listId={selectedList.id} 
          defaultCategoryId={selectedList.defaultCategory} 
          userId={userId} 
        />
      )}
      
      {showAddEditListModal && userId && (
         <AddEditListModal
           isOpen={showAddEditListModal}
           onClose={() => setShowAddEditListModal(false)}
           listToEdit={listToEdit}
           userId={userId}
         />
       )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-primary/40 shadow-neon rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              "{itemToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-muted/80">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
