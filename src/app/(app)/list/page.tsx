"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ShoppingCart, CheckCircle, ListPlus, Lock } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import CreateFirstListPage from './create-first/page'; 
import { useToast } from '@/hooks/use-toast'; // For showing premium messages
import Link from 'next/link'; // For linking to premium page


const FREEMIUM_LIST_LIMIT = 3;

export default function ShoppingListPage() {
  const { state, dispatch, isLoading } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppShoppingListItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'purchased'>('current');
  const isClient = useClientOnly();

  const { selectedListId, shoppingListItems, lists, userId, isPremium } = state; // Added isPremium

   const selectedList: List | undefined = useMemo(() => {
       if (!Array.isArray(lists)) return undefined;
       return lists.find(list => list.id === selectedListId);
   }, [lists, selectedListId]);

  const handleAddItemClick = () => {
    if (!selectedListId) {
      console.error("No list selected, cannot add item.");
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
    if (!selectedListId || !userId) {
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
      ...itemData, listId: selectedListId, userId: userId, category: finalCategory, price: itemData.price ?? 0,
    };
    if (!editingItem) {
      dispatch({ type: 'ADD_SHOPPING_ITEM', payload: itemWithFinalDetails });
    } else {
      const updatePayload: AppShoppingListItem = {
        ...editingItem, ...itemData, listId: selectedListId, userId: userId, category: finalCategory, price: itemData.price ?? 0,
      };
      dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: updatePayload });
    }
    setIsAddItemModalOpen(false);
    setEditingItem(null);
  };

  const itemsForSelectedList = useMemo(() => {
    if (!selectedListId || !Array.isArray(shoppingListItems)) return [];
    return shoppingListItems.filter(item => item.listId === selectedListId);
  }, [selectedListId, shoppingListItems]);

  const currentItems = useMemo(() => itemsForSelectedList.filter(item => !item.checked), [itemsForSelectedList]);
  const purchasedItems = useMemo(() => itemsForSelectedList.filter(item => item.checked), [itemsForSelectedList]);

  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)
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

   if (!isClient || isLoading) {
       return (
           <div className="flex items-center justify-center h-full">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
           </div>
       );
   }
   
   if (isClient && !isLoading && Array.isArray(lists) && lists.length === 0) {
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
          {!selectedListId && Array.isArray(lists) && lists.length > 0 ? (
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
                if (!isPremium && lists.length >= FREEMIUM_LIST_LIMIT && !selectedListId) { // Check if adding a *new* list would exceed limit
                     toast({
                         title: "List Limit Reached",
                         description: (
                            <div className="flex flex-col gap-2">
                               <span>You've reached the freemium limit of {FREEMIUM_LIST_LIMIT} lists.</span>
                               <Button asChild size="sm" className="mt-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                                   <Link href="/premium">Upgrade to Premium</Link>
                               </Button>
                            </div>
                        ),
                         variant: "destructive",
                     });
                } else {
                    handleAddItemClick();
                }
            }}
            size="lg"
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-6 md:right-8 z-30 rounded-full h-14 w-14 p-0 shadow-neon-lg hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 ease-in-out bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Add new item"
            disabled={!selectedListId || isLoading || (!isPremium && lists.length >= FREEMIUM_LIST_LIMIT && !selectedListId) }
        >
            {!isPremium && lists.length >= FREEMIUM_LIST_LIMIT && !selectedListId ? <Lock className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
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
