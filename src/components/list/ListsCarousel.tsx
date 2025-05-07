
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import type { List } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardContent, CardFooter
import { PlusCircle, Trash2, Edit2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddEditListModal } from './AddEditListModal';
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
  const { state, dispatch } = useAppContext();
  const { lists, selectedListId } = state;
  const [isAddEditListModalOpen, setIsAddEditListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [listToDelete, setListToDelete] = useState<List | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current && selectedListId) {
      const selectedCard = scrollContainerRef.current.querySelector(`[data-list-id="${selectedListId}"]`) as HTMLElement;
      if (selectedCard) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const cardRect = selectedCard.getBoundingClientRect();
        let scrollLeft = scrollContainerRef.current.scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width / 2) + (cardRect.width / 2);
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
      setListToDelete(null);
    }
  };

  return (
    <div className="mb-2">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto space-x-2 pb-1 scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {lists.map((list) => {
          const isSelected = list.id === selectedListId;
          return (
            <Card
              key={list.id}
              data-list-id={list.id}
              className={cn(
                "min-w-[100px] max-w-[150px] h-10 flex-shrink-0 cursor-pointer transition-all duration-200 ease-in-out flex items-center justify-between px-3 py-1.5 rounded-md text-sm font-medium",
                "glow-border-inner",
                isSelected
                  ? "bg-primary/20 text-primary shadow-neon ring-1 ring-primary" // Mimic active tab
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-secondary", // Mimic inactive tab
              )}
              onClick={() => handleSelectList(list.id)}
            >
              <CardTitle className={cn(
                "text-xs font-semibold truncate flex-grow leading-none", // Ensure title doesn't wrap and affect height
                 isSelected ? "text-primary" : "text-neonText"
                )}
              >
                {list.name}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0 ml-1 shrink-0", isSelected ? "text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-muted/20")}>
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span className="sr-only">List options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-primary/50 shadow-neon glow-border w-40" align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => handleEditList(list)} className="text-neonText hover:bg-primary/10 focus:bg-primary/20 focus:text-primary cursor-pointer">
                    <Edit2 className="mr-2 h-4 w-4" /> Edit List
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={() => handleDeleteList(list)} className="text-destructive hover:bg-destructive/20 focus:bg-destructive/20 focus:text-destructive cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          );
        })}
        <Button
          variant="outline"
          className={cn(
            "min-w-[90px] h-10 flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium",
            "border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 text-primary glow-border-inner"
          )}
          onClick={handleAddNewList}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          <span className="text-xs">New List</span>
        </Button>
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
