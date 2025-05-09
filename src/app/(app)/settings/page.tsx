"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useAppContext, DEFAULT_CATEGORIES } from '@/context/app-context'; // Import DEFAULT_CATEGORIES
import type { Category } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Trash2, Edit, PlusCircle, Save, X, Lock } from 'lucide-react';
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
import Link from 'next/link'; // For linking to premium page

const FREEMIUM_CUSTOM_CATEGORY_LIMIT = 2; // Allow 2 custom categories on top of defaults

export default function SettingsPage() {
  const { state, dispatch, isLoading: contextLoading } = useAppContext();
  const { toast } = useToast();
  const { categories: currentCategories, isPremium } = state; // Get premium status

  const [categories, setCategories] = useState<Category[]>(currentCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>('uncategorized');

  useEffect(() => {
    setCategories(currentCategories);
  }, [currentCategories]);

  const canAddMoreCategories = useMemo(() => {
    if (isPremium) return true;
    const customCategoriesCount = categories.filter(cat => !DEFAULT_CATEGORIES.some(dc => dc.id === cat.id)).length;
    return customCategoriesCount < FREEMIUM_CUSTOM_CATEGORY_LIMIT;
  }, [categories, isPremium]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddMoreCategories) {
        toast({
            title: "Category Limit Reached",
            description: (
                <div className="flex flex-col gap-2">
                   <span>You've reached the freemium limit for custom categories.</span>
                   <Button asChild size="sm" className="mt-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                       <Link href="/premium">Upgrade to Premium</Link>
                   </Button>
                </div>
            ),
            variant: "destructive",
        });
        return;
    }
    if (newCategoryName.trim() === '') {
      toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({ title: "Error", description: "Category name already exists.", variant: "destructive" });
      return;
    }
    dispatch({ type: 'ADD_CATEGORY', payload: { name: newCategoryName.trim() } });
    setNewCategoryName('');
    toast({ title: "Success", description: "Category added." });
  };

  const handleStartEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
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
    setCategoryToDelete(category);
    const availableCategories = categories.filter(c => c.id !== category.id);
    setReassignCategoryId(availableCategories.length > 0 ? availableCategories[0].id : 'uncategorized');
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const itemsWithCategory = state.shoppingListItems.filter(item => item.category === categoryToDelete.id);
    const finalReassignId = itemsWithCategory.length > 0 ? (reassignCategoryId || 'uncategorized') : undefined;
    dispatch({
      type: 'REMOVE_CATEGORY',
      payload: { categoryId: categoryToDelete.id, reassignToId: finalReassignId }
    });
    setCategoryToDelete(null);
    setReassignCategoryId('uncategorized');
    toast({ title: "Success", description: "Category deleted." });
  };

  const categoriesForReassignment = useMemo(() => {
    if (!categoryToDelete) return [];
    return categories.filter(c => c.id !== categoryToDelete.id);
  }, [categories, categoryToDelete]);

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
                disabled={!canAddMoreCategories}
              />
            </div>
            <Button type="submit" size="icon" className="bg-primary text-primary-foreground h-10 w-10 shrink-0 glow-border-inner" disabled={!canAddMoreCategories}>
              {canAddMoreCategories ? <PlusCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              <span className="sr-only">Add Category</span>
            </Button>
          </form>
          {!canAddMoreCategories && (
            <p className="text-xs text-yellow-500 text-center mt-2">
                You've reached the custom category limit for freemium users.
                <Button variant="link" asChild className="p-0 h-auto text-secondary hover:text-secondary/80 ml-1">
                    <Link href="/premium">Upgrade to Premium</Link>
                </Button> for unlimited categories.
            </p>
          )}
          <div className="space-y-2 pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Your Categories:</h4>
            {categories.length > 0 ? (
              <Card className="p-0 border-border/30 glow-border-inner">
                <ul className="divide-y divide-border/30">
                  {categories.map((category) => (
                    <li key={category.id} className="flex items-center justify-between p-2 hover:bg-muted/10 glow-border-inner">
                      {editingCategoryId === category.id ? (
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
                          <span className="text-sm text-neonText">{category.name}</span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:bg-blue-900/30 glow-border-inner" onClick={() => handleStartEditCategory(category)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-900/30 glow-border-inner" onClick={() => handleDeleteCategoryClick(category)} disabled={DEFAULT_CATEGORIES.some(dc => dc.id === category.id) && !isPremium && category.id !== 'uncategorized'}> {/* Disable delete for default non-uncategorized if not premium */}
                                  {DEFAULT_CATEGORIES.some(dc => dc.id === category.id) && !isPremium && category.id !== 'uncategorized' ? <Lock className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                               <AlertDialogContent className="glow-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category: {categoryToDelete?.name}?</AlertDialogTitle>
                                  {state.shoppingListItems.some(item => item.category === categoryToDelete?.id) ? (
                                    <AlertDialogDescription>
                                      This category is used by some shopping items. Choose a category to reassign these items to, or they will be marked as 'Uncategorized'. If no other categories exist, they will become 'Uncategorized'.
                                    </AlertDialogDescription>
                                  ) : (
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the category.
                                    </AlertDialogDescription>
                                  )}
                                </AlertDialogHeader>
                                {state.shoppingListItems.some(item => item.category === categoryToDelete?.id) && categoriesForReassignment.length > 0 && (
                                  <div className="py-4 grid gap-2">
                                    <Label htmlFor="reassign-category" className="text-neonText/80">Reassign Items To</Label>
                                    <Select
                                      value={reassignCategoryId}
                                      onValueChange={setReassignCategoryId}
                                      defaultValue="uncategorized"
                                    >
                                      <SelectTrigger
                                        id="reassign-category"
                                        className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner"
                                      >
                                        <SelectValue placeholder="Select a category..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-card border-primary/80 text-neonText glow-border-inner">
                                         <SelectItem value="uncategorized" className="focus:bg-secondary/30 focus:text-secondary">Uncategorized</SelectItem>
                                        {categoriesForReassignment.map((cat) => (
                                          <SelectItem key={cat.id} value={cat.id} className="focus:bg-secondary/30 focus:text-secondary">
                                            {cat.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                     <p className="text-xs text-muted-foreground pt-1">Select 'Uncategorized' if you don't want to assign to another specific category.</p>
                                  </div>
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
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No categories added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ... (SettingsPageSkeleton remains the same)
const SettingsPageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-8 w-1/4" />

    {/* Category Section Skeleton */}
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
          </Card>
        </div>
      </CardContent>
    </Card>
  </div>
);
