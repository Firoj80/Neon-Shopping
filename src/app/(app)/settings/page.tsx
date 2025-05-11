"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useAppContext, DEFAULT_CATEGORIES } from '@/context/app-context';
import type { Category, Currency } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Trash2, Edit, PlusCircle, Save, X, Palette, DollarSign } from 'lucide-react';
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
import Link from 'next/link';


export default function SettingsPage() {
  const { state, dispatch } = useAppContext();
  const { categories: currentCategories, currency: currentCurrency, supportedCurrencies, isLoading: contextIsLoading, isInitialDataLoaded, userId } = state;
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>(currentCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>('uncategorized');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(currentCurrency.code);

  useEffect(() => {
    // Filter categories to show only global (userId: null) and current user's categories
    setCategories(currentCategories.filter(cat => cat.userId === null || cat.userId === userId));
  }, [currentCategories, userId]);

  useEffect(() => {
    setSelectedCurrencyCode(currentCurrency.code);
  }, [currentCurrency]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() === '') {
      toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
      return;
    }
    // Check against both global and user-specific categories for name collision
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase() && (cat.userId === null || cat.userId === userId))) {
      toast({ title: "Error", description: "Category name already exists.", variant: "destructive" });
      return;
    }
    dispatch({ type: 'ADD_CATEGORY', payload: { name: newCategoryName.trim() } });
    setNewCategoryName('');
    toast({ title: "Success", description: "Category added." });
  };

  const handleStartEditCategory = (category: Category) => {
    // Prevent editing of default categories by non-owners (should be userId === null)
    if (category.userId === null && category.id !== 'uncategorized') {
        toast({ title: "Action Restricted", description: "Default categories cannot be edited.", variant: "default" });
        return;
    }
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveEditCategory = (id: string) => {
    if (editingCategoryName.trim() === '') {
      toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
      return;
    }
    // Check against both global and user-specific categories for name collision, excluding the one being edited
    if (categories.some(cat => cat.id !== id && cat.name.toLowerCase() === editingCategoryName.trim().toLowerCase() && (cat.userId === null || cat.userId === userId))) {
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
    if (category.id === 'uncategorized' || category.userId === null) { // Prevent deletion of 'uncategorized' and other default system categories
        toast({
            title: "Action Restricted",
            description: "Default categories cannot be deleted.",
            variant: "default",
        });
        return;
    }
    setCategoryToDelete(category);
    const availableCategoriesForReassignment = categories.filter(c => c.id !== category.id && (c.userId === null || c.userId === userId));
    setReassignCategoryId(availableCategoriesForReassignment.find(c => c.id !== 'uncategorized')?.id || 'uncategorized');
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete || !userId) return;
    
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
    if (!categoryToDelete || !userId) return [];
    // Only allow reassigning to global or user's own categories
    return categories.filter(c => c.id !== categoryToDelete.id && (c.userId === null || c.userId === userId));
  }, [categories, categoryToDelete, userId]);

  const handleCurrencyChange = (currencyCode: string) => {
    const newCurrency = state.supportedCurrencies.find(c => c.code === currencyCode);
    if (newCurrency) {
        dispatch({ type: 'SET_CURRENCY', payload: newCurrency });
        toast({ title: "Success", description: `Currency changed to ${newCurrency.name} (${newCurrency.symbol}).`});
    }
  };

  const isLoading = contextIsLoading || !isInitialDataLoaded;

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  const userCreatedCategories = categories.filter(cat => cat.userId === userId && cat.id !== 'uncategorized');
  const defaultSystemCategories = DEFAULT_CATEGORIES.filter(cat => cat.id !== 'uncategorized');


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>
      
      {/* Currency Settings Card */}
      <Card className="bg-card border-primary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Currency
          </CardTitle>
          <CardDescription className="text-muted-foreground">Select your preferred currency.</CardDescription>
        </CardHeader>
        <CardContent className="glow-border-inner p-4">
            <div className="grid gap-1.5">
                <Label htmlFor="currency-select" className="text-neonText/80 text-xs">Select Currency</Label>
                <Select value={selectedCurrencyCode} onValueChange={handleCurrencyChange}>
                    <SelectTrigger id="currency-select" className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner">
                        <SelectValue placeholder="Select currency..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary/80 text-neonText max-h-60 overflow-y-auto glow-border-inner" position="popper">
                        {/* Defensive check before mapping */}
                        {Array.isArray(state.supportedCurrencies) && state.supportedCurrencies.length > 0 ? (
                            state.supportedCurrencies.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code} className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary">
                                    {currency.name} ({currency.symbol})
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="loading" disabled>Loading currencies...</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      {/* Category Management Card */}
      <Card className="bg-card border-secondary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center gap-2">
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
              />
            </div>
            <Button type="submit" size="icon" className="bg-secondary text-secondary-foreground h-10 w-10 shrink-0 glow-border-inner">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Add Category</span>
            </Button>
          </form>
          
          <div className="space-y-2 pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Your Categories:</h4>
            {userCreatedCategories.length > 0 ? (
              <Card className="p-0 border-border/30 glow-border-inner">
                <ScrollArea className="h-auto max-h-48"> 
                  <ul className="divide-y divide-border/30">
                    {userCreatedCategories.map((category) => (
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
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/30 glow-border-inner" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm text-neonText">{category.name}</span>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:bg-blue-900/30 glow-border-inner" onClick={() => handleStartEditCategory(category)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-900/30 glow-border-inner" onClick={() => handleDeleteCategoryClick(category)}>
                                      <Trash2 className="h-4 w-4" />
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
                                            <SelectTrigger id={`reassign-category-${categoryToDelete.id}`} className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner">
                                              <SelectValue placeholder="Select a category..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-primary/80 text-neonText glow-border-inner">
                                              <SelectItem value="uncategorized" className="focus:bg-secondary/30 focus:text-secondary">Uncategorized</SelectItem>
                                              {categoriesForReassignment.filter(c => c.id !== 'uncategorized').map((cat) => ( // Exclude uncategorized from re-assign options here if it is the target
                                                <SelectItem key={cat.id} value={cat.id} className="focus:bg-secondary/30 focus:text-secondary">
                                                  {cat.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <p className="text-xs text-muted-foreground pt-1">Items will be reassigned to 'Uncategorized' if no other selection is made or if target is 'Uncategorized'.</p>
                                        </div>
                                      )}
                                       {state.shoppingListItems.some(item => item.category === categoryToDelete?.id && item.userId === userId) && categoriesForReassignment.length === 0 && (
                                         <p className="text-sm text-muted-foreground py-2">Items will be moved to 'Uncategorized'.</p>
                                       )}
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setCategoryToDelete(null)} className="glow-border-inner">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-border-inner">
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
                    ))}
                  </ul>
                </ScrollArea>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No custom categories added yet.</p>
            )}
          </div>

            <div className="space-y-2 pt-4">
                <h4 className="text-sm font-medium text-muted-foreground">Default Categories:</h4>
                <Card className="p-0 border-border/30 glow-border-inner">
                    <ScrollArea className="h-auto max-h-48">
                         <ul className="divide-y divide-border/30">
                             {defaultSystemCategories.map((category) => (
                                 <li key={category.id} className="flex items-center justify-between p-2 hover:bg-muted/10 glow-border-inner">
                                     <span className="text-sm text-neonText/70 italic">{category.name} (Default)</span>
                                     {/* Default categories cannot be edited or deleted from here */}
                                     <div className="flex items-center gap-1 opacity-50">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled><Edit className="h-4 w-4" /></Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled><Trash2 className="h-4 w-4" /></Button>
                                     </div>
                                 </li>
                             ))}
                         </ul>
                    </ScrollArea>
                </Card>
            </div>


        </CardContent>
      </Card>

      {/* Theme Settings Card (Link to Themes Page) */}
      <Card className="bg-card border-purple-500/30 shadow-neon glow-border">
        <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
                <Palette className="h-5 w-5" /> App Theme
            </CardTitle>
            <CardDescription className="text-muted-foreground">Customize the look and feel of Neon Shopping.</CardDescription>
        </CardHeader>
        <CardContent className="glow-border-inner p-4">
            <Button asChild className="w-full bg-purple-500 hover:bg-purple-500/90 text-white glow-border-inner">
                <Link href="/themes">Change Theme</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const SettingsPageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-8 w-1/4" />
    {/* Currency Skeleton */}
    <Card className="bg-card border-border/20 shadow-md glow-border">
      <CardHeader>
        <Skeleton className="h-6 w-1/5 mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="glow-border-inner p-4">
        <Skeleton className="h-3 w-1/4 mb-1.5" />
        <Skeleton className="h-10 w-full rounded-md glow-border-inner" />
      </CardContent>
    </Card>
    {/* Categories Skeleton */}
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
    {/* Theme Skeleton */}
    <Card className="bg-card border-border/20 shadow-md glow-border">
      <CardHeader>
        <Skeleton className="h-6 w-1/5 mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="glow-border-inner p-4">
        <Skeleton className="h-10 w-full rounded-md glow-border-inner" />
      </CardContent>
    </Card>
  </div>
);
