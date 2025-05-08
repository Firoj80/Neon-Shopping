"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import type { Currency, Category } from '@/context/app-context';
import { getSupportedCurrencies, getUserCurrency } from '@/services/currency';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Banknote, Layers, Trash2, Edit, PlusCircle, Save, X } from 'lucide-react';
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

export default function SettingsPage() {
  const { state, dispatch, isLoading: contextLoading } = useAppContext();
  const { toast } = useToast();

  const [supportedCurrencies, setSupportedCurrencies] = useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [categories, setCategories] = useState<Category[]>(state.categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>('uncategorized');

  useEffect(() => {
    const fetchAndDetectCurrency = async () => {
      setIsLoadingCurrencies(true);
      try {
        const currencies = await getSupportedCurrencies();
        setSupportedCurrencies(currencies);

        // Only auto-detect if the currency is default (USD) or not set
        if (!state.currency.code || state.currency.code === 'USD') {
            let detectedCurrency = null;
             if (typeof window !== 'undefined') { // Ensure running in browser
                detectedCurrency = await getUserCurrency();
             }

          if (detectedCurrency && currencies.some(c => c.code === detectedCurrency.code)) {
            dispatch({ type: 'SET_CURRENCY', payload: detectedCurrency });
            toast({
              title: "Currency Auto-Detected",
              description: `Currency set to ${detectedCurrency.name} (${detectedCurrency.code}). You can change this below.`,
              variant: "default",
            });
          } else if (!state.currency.code && currencies.length > 0) {
            // If no currency set and detection failed, default to USD or first in list
            const usd = currencies.find(c => c.code === 'USD') || currencies[0];
            dispatch({ type: 'SET_CURRENCY', payload: usd });
          }
        }
      } catch (error) {
        console.error("Failed to fetch/detect currency:", error);
        toast({ title: "Currency Error", description: "Could not load currency information. Defaulting to USD.", variant: "destructive" });
        if (!state.currency.code) {
            // Ensure a default currency is set even if everything fails
            const fallbackCurrency = supportedCurrencies.find(c => c.code === 'USD') || { code: 'USD', symbol: '$', name: 'US Dollar' };
            dispatch({ type: 'SET_CURRENCY', payload: fallbackCurrency });
        }
      } finally {
        setIsLoadingCurrencies(false);
      }
    };
    fetchAndDetectCurrency();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, toast]); // Run once on mount

  const handleSelectCurrency = (currencyCode: string) => {
    const selected = supportedCurrencies.find(c => c.code === currencyCode);
    if (selected) {
      dispatch({ type: 'SET_CURRENCY', payload: selected });
      toast({
        title: "Currency Updated",
        description: `Currency set to ${selected.name} (${selected.code}).`,
        variant: "default",
        className: "bg-primary/10 border-primary text-primary-foreground",
      });
    }
  };

  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) return supportedCurrencies;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return supportedCurrencies.filter(currency =>
      currency.name.toLowerCase().includes(lowerSearchTerm) ||
      currency.code.toLowerCase().includes(lowerSearchTerm) ||
      currency.symbol.toLowerCase().includes(lowerSearchTerm)
    );
  }, [supportedCurrencies, searchTerm]);


  useEffect(() => {
    setCategories(state.categories);
  }, [state.categories]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
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
    const canReassign = categoriesForReassignment.length > 0;

    // Use 'uncategorized' as the default reassignment if nothing else is chosen
    const finalReassignId = itemsWithCategory.length > 0 ? (reassignCategoryId || 'uncategorized') : undefined;

    dispatch({
      type: 'REMOVE_CATEGORY',
      payload: {
        categoryId: categoryToDelete.id,
        reassignToId: finalReassignId
      }
    });
    setCategoryToDelete(null);
    setReassignCategoryId('uncategorized'); // Reset selection
    toast({ title: "Success", description: "Category deleted." });
  };


  const isLoading = contextLoading || isLoadingCurrencies;

  const categoriesForReassignment = useMemo(() => {
    if (!categoryToDelete) return [];
    // Exclude the category being deleted itself
    return categories.filter(c => c.id !== categoryToDelete.id);
  }, [categories, categoryToDelete]);

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>

      <Card className="bg-card border-primary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center gap-2">
            <Banknote className="h-5 w-5" /> Currency
          </CardTitle>
          <CardDescription className="text-muted-foreground">Select the currency for displaying prices and budget.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 glow-border-inner p-4">
          <div className="grid gap-2">
             <Label htmlFor="currency-search" className="text-neonText/80">Search Currency</Label>
             <Input
                id="currency-search"
                type="text"
                placeholder="e.g., USD, Euro, $"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner"
            />

            <Label htmlFor="currency-select" className="text-neonText/80 mt-3">Select Currency</Label>
            <Select
              value={state.currency.code || ''}
              onValueChange={handleSelectCurrency}
              disabled={filteredCurrencies.length === 0 && !isLoadingCurrencies}
            >
              <SelectTrigger
                id="currency-select"
                className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary glow-border-inner"
              >
                <SelectValue placeholder={state.currency.code ? `${state.currency.name} (${state.currency.symbol})` : (isLoadingCurrencies ? "Loading..." : "Select a currency")} />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/80 text-neonText max-h-60 glow-border-inner" position="popper">
                <ScrollArea className="h-full">
                  <SelectGroup>
                    <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Currencies</SelectLabel>
                    {isLoadingCurrencies && filteredCurrencies.length === 0 ? (
                         <SelectItem value="loading" disabled>Loading currencies...</SelectItem>
                    ) : filteredCurrencies.length > 0 ? (
                      filteredCurrencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code} className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2">
                          {currency.name} ({currency.symbol})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-results" disabled>No currencies match your search.</SelectItem>
                    )}
                  </SelectGroup>
                </ScrollArea>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">
              Your currency might be auto-detected. You can always change it here.
            </p>
          </div>
        </CardContent>
      </Card>

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
              />
            </div>
            <Button type="submit" size="icon" className="bg-primary text-primary-foreground h-10 w-10 shrink-0 glow-border-inner">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Add Category</span>
            </Button>
          </form>
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
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-900/30 glow-border-inner" onClick={() => handleDeleteCategoryClick(category)}>
                                  <Trash2 className="h-4 w-4" />
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
                                      defaultValue="uncategorized" // Default to uncategorized
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

const SettingsPageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-8 w-1/4" />

    <Card className="bg-card border-border/20 shadow-md glow-border">
      <CardHeader>
        <Skeleton className="h-6 w-1/5 mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4 glow-border-inner p-4">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full rounded-md glow-border-inner" />
          <Skeleton className="h-4 w-1/4 mt-3" />
          <Skeleton className="h-10 w-full rounded-md glow-border-inner" />
          <Skeleton className="h-3 w-2/3 mt-1" />
        </div>
      </CardContent>
    </Card>

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
