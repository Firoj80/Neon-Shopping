// src/app/(app)/settings/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useAppContext, DEFAULT_CATEGORIES } from '@/context/app-context';
import type { Category } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Trash2, Edit, PlusCircle, Save, X } from 'lucide-react'; // Removed Lock
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
// Removed Link import

export default function SettingsPage() {
  const { state, dispatch, isLoading: contextLoading } = useAppContext();
  const { toast } = useToast();
  const { categories: currentCategories, userId } = state; // Removed isPremium

  const [categories, setCategories] = useState<Category[]>(currentCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>('uncategorized');

  useEffect(() => {
    setCategories(currentCategories);
  }, [currentCategories]);

  // All users can manage categories
  const canAddCategories = true; 

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddCategories) { // This check is redundant now but kept for structure
        toast({
            title: "Error", // Generic error, though this path shouldn't be hit
            description: "Cannot add categories at this time.",
            variant: "destructive",
        });
        return;
    }
    if (newCategoryName.trim() === '') {
      toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
      return;
    }
    // Check against all categories (user's and global defaults they haven't customized)
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({ title: "Error", description: "Category name already exists.", variant: "destructive" });
      return;
    }
    dispatch({ type: 'ADD_CATEGORY', payload: { name: newCategoryName.trim() } });
    setNewCategoryName('');
    toast({ title: "Success", description: "Category added." });
  };

  const handleStartEditCategory = (category: Category) => {
    // User can edit their own categories or default global categories
    if (category.userId === userId || category.userId === null) {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    } else {
        toast({ title: "Action Restricted", description: "You can only edit your own categories or default categories.", variant: "default" });
    }
  };

  const handleSaveEditCategory = (id: string) => {
    if (editingCategoryName.trim() === '') {
      toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
      return;
    }
    if (categories.some(cat => cat.id !== id && cat.name.toLowerCase() === editingCategoryName.trim().toLowerCase())) {
      toast({ title: "Error", description: "Category name already exists.", variant: "destructive" });
      return;
    }
    dispatch({ type: 'UPDATE_CATEGORY', payload: { id, name: editingCategoryName.trim() } });
    setEditingCategoryId(null);
    setEditingCategoryName('');
    toast({ title: "Success", description: "Category updated." });
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleDeleteCategoryClick = (category: Category) => {
    if (category.id === 'uncategorized') {
        toast({
            title: "Action Restricted",
            description: "The 'Uncategorized' category cannot be deleted.",
            variant: "default",
        });
        return;
    }
    // All users can delete any category (their own or defaults)
    setCategoryToDelete(category);
    const availableCategories = categories.filter(c => c.id !== category.id);
    setReassignCategoryId(availableCategories.find(c => c.id !== 'uncategorized')?.id || 'uncategorized');
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    const itemsWithCategory = state.shoppingListItems.filter(item => item.category === categoryToDelete.id && item.userId === userId);
    const finalReassignId = (categoriesForReassignment.some(c => c.id === reassignCategoryId) || reassignCategoryId === 'uncategorized') 
                            ? reassignCategoryId 
                            : 'uncategorized';

    dispatch({
      type: 'REMOVE_CATEGORY',
      payload: { categoryId: categoryToDelete.id, reassignToId: itemsWithCategory.length > 0 ? finalReassignId : undefined }
    });
    setCategoryToDelete(null);
    setReassignCategoryId('uncategorized');
    toast({ title: "Success", description: "Category deleted." });
  };

  const categoriesForReassignment = useMemo(() => {
    if (!categoryToDelete) return [];
    return categories.filter(c => c.id !== categoryToDelete.id && (c.userId === userId || c.userId === null));
  }, [categories, categoryToDelete, userId]);

  const isLoading = contextLoading;

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>
      <Card className="bg-card border-secondary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Layers className="h-5 w-5" /> Categories
          </CardTitle>
          <CardDescription className="text-muted-foreground">Manage your shopping item categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 glow-border-inner p-4">
          <form onSubmit={handleAddCategory} className="flex items-end gap-2">
            <div className="flex-grow grid gap-1.5">
              <Label htmlFor="new-category" className="text-neonText/80 text-xs">New Category Name</Label>
              <Input
                id="new-category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Clothing"
                className="border-secondary/50 focus:border-secondary focus:shadow-neon focus:ring-secondary glow-border-inner"
                disabled={!canAddCategories} // Kept for consistency, though always true now
              />
            </div>
            <Button type="submit" size="icon" className="bg-primary text-primary-foreground h-10 w-10 shrink-0 glow-border-inner" disabled={!canAddCategories}>
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Add Category</span>
            </Button>
          </form>
          
          <div className="space-y-2 pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Your & Default Categories:</h4>
            {categories.length > 0 ? (
              <Card className="p-0 border-border/30 glow-border-inner">
                <ScrollArea className="h-auto max-h-72">
                  <ul className="divide-y divide-border/30">
                    {categories.map((category) => {
                      const canEditThisCategory = category.userId === userId || category.userId === null;
                      const canDeleteThisCategory = category.id !== 'uncategorized'; // Uncategorized cannot be deleted

                      return (
                        <li key={category.id} className="flex items-center justify-between p-2 hover:bg-muted/10 glow-border-inner">
                          {editingCategoryId === category.id && canEditThisCategory ? (
                            <div className="flex-grow flex items-center gap-2">
                              <Input
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                className="h-8 flex-grow border-secondary/50 focus:border-secondary focus:shadow-neon focus:ring-secondary glow-border-inner"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEditCategory(category.id)}
                              />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-900/30 glow-border-inner" onClick={() => handleSaveEditCategory(category.id)}>
                                <Save className="h-4 w-4" />
                                <span className="sr-only">Save</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/30 glow-border-inner" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cancel</span>
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm text-neonText">{category.name} {category.userId === null && category.id !== 'uncategorized' && <span className="text-xs text-muted-foreground/70">(Default)</span>}</span>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:bg-blue-900/30 glow-border-inner" onClick={() => handleStartEditCategory(category)} disabled={!canEditThisCategory}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 text-red-500 hover:bg-red-900/30 glow-border-inner" 
                                      onClick={() => handleDeleteCategoryClick(category)} 
                                      disabled={!canDeleteThisCategory}
                                    >
                                      {!canDeleteThisCategory ? <X className="h-4 w-4 text-muted-foreground/50" /> : <Trash2 className="h-4 w-4" />}
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  {categoryToDelete && categoryToDelete.id === category.id && (
                                     <AlertDialogContent className="glow-border">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Category: {categoryToDelete?.name}?</AlertDialogTitle>
                                        {state.shoppingListItems.some(item => item.category === categoryToDelete?.id && item.userId === userId) ? (
                                          <AlertDialogDescription>
                                            This category is used by some shopping items. Choose a category to reassign these items to, or they will be marked as 'Uncategorized'.
                                          </AlertDialogDescription>
                                        ) : (
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the category.
                                          </AlertDialogDescription>
                                        )}
                                      </AlertDialogHeader>
                                      {state.shoppingListItems.some(item => item.category === categoryToDelete?.id && item.userId === userId) && categoriesForReassignment.length > 0 && (
                                        <div className="py-4 grid gap-2">
                                          <Label htmlFor={`reassign-category-${categoryToDelete.id}`} className="text-neonText/80">Reassign Items To</Label>
                                          <Select
                                            value={reassignCategoryId}
                                            onValueChange={setReassignCategoryId}
                                          >
                                            <SelectTrigger
                                              id={`reassign-category-${categoryToDelete.id}`}
                                              className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner"
                                            >
                                              <SelectValue placeholder="Select a category..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-primary/80 text-neonText glow-border-inner">
                                              <SelectItem value="uncategorized" className="focus:bg-secondary/30 focus:text-secondary">Uncategorized</SelectItem>
                                              {categoriesForReassignment.filter(c => c.id !== 'uncategorized').map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="focus:bg-secondary/30 focus:text-secondary">
                                                  {cat.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <p className="text-xs text-muted-foreground pt-1">Items will be reassigned to 'Uncategorized' if no other selection is made.</p>
                                        </div>
                                      )}
                                       {state.shoppingListItems.some(item => item.category === categoryToDelete?.id && item.userId === userId) && categoriesForReassignment.length === 0 && (
                                         <p className="text-sm text-muted-foreground py-2">Items will be moved to 'Uncategorized'.</p>
                                       )}
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setCategoryToDelete(null)} className="glow-border-inner">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={confirmDeleteCategory}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-border-inner"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  )}
                                </AlertDialog>
                              </div>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No categories found. Add some!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SettingsPageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-8 w-1/4" />
    <Card className="bg-card border-border/20 shadow-md glow-border">
      <CardHeader>
        <Skeleton className="h-6 w-1/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4 glow-border-inner p-4">
        <div className="flex items-end gap-2">
          <div className="flex-grow grid gap-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-10 w-full rounded-md glow-border-inner" />
          </div>
          <Skeleton className="h-10 w-10 rounded-md shrink-0 glow-border-inner" />
        </div>
        <div className="space-y-2 pt-4">
          <Skeleton className="h-5 w-1/3" />
          <Card className="p-0 border-border/30 glow-border-inner">
             <ScrollArea className="h-auto max-h-72">
                <ul className="divide-y divide-border/30">
                {[1, 2].map(i => (
                    <li key={i} className="flex items-center justify-between p-2 glow-border-inner">
                    <Skeleton className="h-4 w-2/5" />
                    <div className="flex items-center gap-1">
                        <Skeleton className="h-7 w-7 rounded-md glow-border-inner" />
                        <Skeleton className="h-7 w-7 rounded-md glow-border-inner" />
                    </div>
                    </li>
                ))}
                </ul>
            </ScrollArea>
          </Card>
        </div>
      </CardContent>
    </Card>
  </div>
);
