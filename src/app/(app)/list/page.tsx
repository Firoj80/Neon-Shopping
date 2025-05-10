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
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from '@/components/shopping/item-card';
import { PlusCircle, Search, LayoutList, ShoppingCart } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { useClientOnly } from '@/hooks/use-client-only';
// Removed CreateFirstListPage import, as AppLayout handles the redirect to the route.


export default function ShoppingListPage() {
  const { state, dispatch, isLoading, isInitialDataLoaded } = useAppContext();
  const { lists, selectedListId, shoppingListItems, currency, categories, budget, isPremium } = state;

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
  }, [itemsForSelectedList, searchTerm]);


  const handleAddItemClick = () => {
    if (!selectedListId) {
      // Optionally, prompt to select or create a list first
      // For now, let's assume a list must be selected to add items.
      // This case should ideally be handled by disabling the button if no list is selected.
      // Or, if FREEMIUM_LIST_LIMIT is reached and not premium.
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
    setListToEdit(null); // Ensure it's for a new list
    setShowAddEditListModal(true);
  };
  
  const handleEditList = (list: List) => {
    setListToEdit(list);
    setShowAddEditListModal(true);
  };


  // This page should only render if lists exist or if loading.
  // The redirect to /list/create-first is handled by AppLayout.
  if (!isClient || isLoading || !isInitialDataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
            <ShoppingCart className="w-16 h-16 animate-pulse text-primary" />
            <p className="mt-4 text-lg font-semibold">Loading Your Shopping Space...</p>
        </div>
      </div>
    );
  }
  
  // This check is a fallback, AppLayout should handle the primary redirect.
  if (lists.length === 0 && !isLoading) {
     // This indicates AppLayout's redirect should have occurred.
     // Showing a simpler loader or message here.
     return (
        <div className="flex items-center justify-center h-screen">
            <p>No lists found. Redirecting...</p>
        </div>
     );
  }


  return (
    <div className="flex flex-col h-full space-y-4">
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
        isPremium={isPremium}
      />
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/30 focus:border-primary focus:shadow-neon"
        />
      </div>

      <Tabs defaultValue="current" className="flex-grow flex flex-col min-h-0"> {/* Ensure Tabs can shrink */}
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-card border border-primary/20 shadow-sm">
          <TabsTrigger value="current" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon-sm transition-all">
            Current ({currentItems.length})
          </TabsTrigger>
          <TabsTrigger value="purchased" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon-sm transition-all">
            Purchased ({purchasedItems.length})
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-grow h-0 pr-1"> {/* ScrollArea takes up remaining space and allows content to scroll */}
          <TabsContent value="current" className="mt-0">
            {currentItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <LayoutList className="mx-auto h-12 w-12 mb-2" />
                No current items. Add some!
              </div>
            ) : (
              <div className="space-y-2">
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
              <div className="space-y-2">
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
        </ScrollArea>
      </Tabs>

      {selectedListId && (
        <Button
            onClick={handleAddItemClick}
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:bottom-8 sm:right-8 z-10 rounded-full h-14 w-14 p-0 shadow-neon-lg bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
            aria-label="Add new item"
            disabled={!selectedListId || (!isPremium && lists.find(l => l.id === selectedListId) && itemsForSelectedList.length >= 1000)} // Example limit for non-premium
        >
            <PlusCircle className="h-7 w-7" />
        </Button>
      )}

      {showAddEditItemModal && selectedList && (
        <AddEditItemModal
          isOpen={showAddEditItemModal}
          onClose={() => setShowAddEditItemModal(false)}
          itemToEdit={itemToEdit}
          listId={selectedList.id} // Pass selected list ID
          defaultCategoryId={selectedList.defaultCategory} // Pass default category from list
          userId={state.userId!} // userId will be set by AppProvider
        />
      )}
      
      {showAddEditListModal && (
         <AddEditListModal
           isOpen={showAddEditListModal}
           onClose={() => setShowAddEditListModal(false)}
           listToEdit={listToEdit}
           userId={state.userId!}
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
