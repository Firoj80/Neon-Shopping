"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import type { List } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Edit2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddEditListModal } from './AddEditListModal'; // Create this modal
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const ListsCarousel: React.FC = () => {
  const { state, dispatch, formatCurrency } = useAppContext();
  const { lists, selectedListId, shoppingListItems } = state;
  const [isAddEditListModalOpen, setIsAddEditListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [listToDelete, setListToDelete] = useState<List | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the selected list card when selectedListId changes or lists update
    if (scrollContainerRef.current && selectedListId) {
      const selectedCard = scrollContainerRef.current.querySelector(`[data-list-id="${selectedListId}"]`) as HTMLElement;
      if (selectedCard) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const cardRect = selectedCard.getBoundingClientRect();

        // Calculate scroll position to center the card if possible, or bring it into view
        let scrollLeft = scrollContainerRef.current.scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width / 2) + (cardRect.width / 2);

        // Ensure scrollLeft is within bounds
        scrollLeft = Math.max(0, Math.min(scrollLeft, scrollContainerRef.current.scrollWidth - containerRect.width));

        scrollContainerRef.current.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedListId, lists]);


  const handleSelectList = (listId: string) => {
    dispatch({ type: 'SELECT_LIST', payload: listId });
  };

  const handleAddNewList = () => {
    setEditingList(null);
    setIsAddEditListModalOpen(true);
  };

  const handleEditList = (list: List) => {
    setEditingList(list);
    setIsAddEditListModalOpen(true);
  };

  const handleDeleteList = (list: List) => {
    setListToDelete(list);
  };

  const confirmDeleteList = () => {
    if (listToDelete) {
      dispatch({ type: 'DELETE_LIST', payload: listToDelete.id });
      // TODO: Firebase - deleteListFromFirestore(listToDelete.id);
      setListToDelete(null);
    }
  };

  const calculateListSpent = (listId: string): number => {
    return shoppingListItems
      .filter(item => item.listId === listId && item.checked)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="mb-3">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto space-x-3 pb-3 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }} // For Firefox
      >
        {lists.map((list) => {
          const spent = calculateListSpent(list.id);
          const isSelected = list.id === selectedListId;
          return (
            <Card
              key={list.id}
              data-list-id={list.id}
              className={cn(
                "min-w-[160px] sm:min-w-[180px] flex-shrink-0 cursor-pointer transition-all duration-200 ease-in-out glow-border-inner",
                isSelected
                  ? "border-primary shadow-neon ring-2 ring-primary bg-primary/10 transform scale-105"
                  : "border-muted-foreground/30 hover:border-secondary hover:bg-secondary/10",
              )}
              onClick={() => handleSelectList(list.id)}
            >
              <CardHeader className="p-3 pb-1">
                <div className="flex justify-between items-start">
                    <CardTitle className={cn("text-sm font-semibold truncate", isSelected ? "text-primary" : "text-neonText")}>{list.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className={cn("h-6 w-6 -mr-2 -mt-1", isSelected ? "text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-muted/20")}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">List options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-card border-primary/50 shadow-neon glow-border w-40" align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleEditList(list)} className="text-neonText hover:bg-primary/10 focus:bg-primary/20 focus:text-primary">
                                <Edit2 className="mr-2 h-4 w-4" /> Edit List
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem onClick={() => handleDeleteList(list)} className="text-destructive hover:bg-destructive/20 focus:bg-destructive/20 focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete List
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 pb-2 text-xs">
                <div className={cn("text-xs", isSelected ? "text-primary/90" : "text-muted-foreground")}>
                  Spent: {formatCurrency(spent)}
                </div>
                <div className={cn("text-xs", isSelected ? "text-primary/70" : "text-muted-foreground/80")}>
                  Limit: {formatCurrency(list.budgetLimit)}
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card
          className="min-w-[120px] sm:min-w-[140px] flex-shrink-0 flex flex-col items-center justify-center cursor-pointer border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 ease-in-out glow-border-inner"
          onClick={handleAddNewList}
        >
          <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <PlusCircle className="h-6 w-6 text-primary mb-1" />
            <span className="text-xs font-medium text-primary">New List</span>
          </CardContent>
        </Card>
      </div>

      <AddEditListModal
        isOpen={isAddEditListModalOpen}
        onClose={() => setIsAddEditListModalOpen(false)}
        listData={editingList}
      />

      <AlertDialog open={!!listToDelete} onOpenChange={(open) => !open && setListToDelete(null)}>
        <AlertDialogContent className="glow-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List: {listToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the list and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setListToDelete(null)} className="glow-border-inner">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteList} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-border-inner">
              <Trash2 className="mr-2 h-4 w-4" /> Delete List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
