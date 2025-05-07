
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Banknote, Layers, Trash2, Edit, PlusCircle, Save, X, Palette } from 'lucide-react'; // Added Palette icon
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
import { cn } from '@/lib/utils';
import { themes as appThemes, type Theme as AppTheme } from '@/config/themes'; // Import themes

export default function SettingsPage() {
  const { state, dispatch, isLoading: contextLoading } = useAppContext();
  const { toast } = useToast();

  const [supportedCurrencies, setSupportedCurrencies] = useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  const [categories, setCategories] = useState<Category[]>(state.categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>('');

  useEffect(() => {
    const fetchAndDetectCurrency = async () => {
      setIsLoadingCurrencies(true);
      let detectedCurrency = null;
      try {
        const currencies = await getSupportedCurrencies();
        setSupportedCurrencies(currencies);
        if (!state.currency.code) {
          detectedCurrency = await getUserCurrency();
          if (detectedCurrency && currencies.some(c => c.code === detectedCurrency!.code)) {
            dispatch({ type: 'SET_CURRENCY', payload: detectedCurrency });
            toast({
              title: "Currency Detected",
              description: `Currency set to ${detectedCurrency.name} (${detectedCurrency.code}).`,
              variant: "default",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch/detect currency:", error);
        toast({ title: "Error", description: "Could not load currency information.", variant: "destructive" });
      } finally {
        setIsLoadingCurrencies(false);
      }
    };
    fetchAndDetectCurrency();
  }, [dispatch, state.currency.code, toast]);

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
    setReassignCategoryId(availableCategories.length > 0 ? availableCategories[0].id : '');
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const itemsWithCategory = state.shoppingList.filter(item => item.category === categoryToDelete.id);
    if (itemsWithCategory.length > 0 && !reassignCategoryId) {
      toast({ title: "Reassignment Required", description: "Select category to reassign items.", variant: "destructive" });
      return;
    }
    dispatch({
      type: 'REMOVE_CATEGORY',
      payload: { categoryId: categoryToDelete.id, reassignToId: itemsWithCategory.length > 0 ? reassignCategoryId : undefined }
    });
    setCategoryToDelete(null);
    setReassignCategoryId('');
    toast({ title: "Success", description: "Category deleted." });
  };

  const handleThemeSelect = (themeId: string) => {
    dispatch({ type: 'SET_THEME', payload: themeId });
    const selectedTheme = appThemes.find(t => t.id === themeId);
    toast({
      title: "Theme Changed",
      description: `Switched to ${selectedTheme?.name || 'selected'} theme.`,
    });
  };

  const isLoading = contextLoading || isLoadingCurrencies;

  const categoriesForReassignment = useMemo(() => {
    if (!categoryToDelete) return [];
    return categories.filter(c => c.id !== categoryToDelete.id);
  }, [categories, categoryToDelete]);

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>

      {/* --- Appearance Settings --- */}
      <Card className="bg-card border-secondary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Palette className="h-5 w-5" /> Appearance
          </CardTitle>
          <CardDescription className="text-muted-foreground">Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 glow-border-inner p-4">
          <Label className="text-neonText/80">Select Theme</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {appThemes.map((theme) => (
              <Button
                key={theme.id}
                variant="outline"
                className={cn(
                  "flex flex-col items-center justify-center p-3 h-24 rounded-lg border-2 transition-all duration-200 ease-in-out glow-border-inner",
                  state.theme === theme.id
                    ? "border-primary shadow-neon ring-2 ring-primary"
                    : "border-muted-foreground/30 hover:border-secondary"
                )}
                onClick={() => handleThemeSelect(theme.id)}
                style={{ borderColor: state.theme === theme.id ? theme.previewColor : undefined }}
              >
                <div
                  className="w-8 h-8 rounded-full mb-2 border border-foreground/20"
                  style={{ backgroundColor: theme.previewColor }}
                />
                <span className={cn(
                    "text-xs text-center truncate w-full",
                     state.theme === theme.id ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {theme.name}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* --- Currency Settings --- */}
      <Card className="bg-card border-primary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center gap-2">
            <Banknote className="h-5 w-5" /> Currency
          </CardTitle>
          <CardDescription className="text-muted-foreground">Select the currency for displaying prices and budget.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 glow-border-inner p-4">
          <div className="grid gap-2">
            <Label htmlFor="currency-select" className="text-neonText/80">Select Currency</Label>
            <Select
              value={state.currency.code || ''}
              onValueChange={handleSelectCurrency}
              disabled={supportedCurrencies.length === 0}
            >
              <SelectTrigger
                id="currency-select"
                className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary glow-border-inner"
              >
                <SelectValue placeholder={state.currency.code ? `${state.currency.name} (${state.currency.symbol})` : "Select a currency"} />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/80 text-neonText max-h-60 overflow-y-auto glow-border-inner" position="popper">
                <ScrollArea className="h-full">
                  <SelectGroup>
                    <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Currencies</SelectLabel>
                    {supportedCurrencies.length > 0 ? (
                      supportedCurrencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code} className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2">
                          {currency.name} ({currency.symbol})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>Loading currencies...</SelectItem>
                    )}
                  </SelectGroup>
                </ScrollArea>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">
              Your currency might be auto-detected on first use. You can always change it here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --- Category Settings --- */}
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

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent className="glow-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category: {categoryToDelete?.name}?</AlertDialogTitle>
            {state.shoppingList.some(item => item.category === categoryToDelete?.id) ? (
              <AlertDialogDescription>
                This category is used by some shopping items. Please choose a category to reassign these items to before deleting.
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the category.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {state.shoppingList.some(item => item.category === categoryToDelete?.id) && (
            <div className="py-4 grid gap-2">
              <Label htmlFor="reassign-category" className="text-neonText/80">Reassign Items To</Label>
              <Select
                value={reassignCategoryId}
                onValueChange={setReassignCategoryId}
                disabled={categoriesForReassignment.length === 0}
              >
                <SelectTrigger
                  id="reassign-category"
                  className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner"
                >
                  <SelectValue placeholder={categoriesForReassignment.length > 0 ? "Select a category..." : "No other categories available"} />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/80 text-neonText glow-border-inner">
                  {categoriesForReassignment.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="focus:bg-secondary/30 focus:text-secondary">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-border-inner"
              disabled={state.shoppingList.some(item => item.category === categoryToDelete?.id) && !reassignCategoryId && categoriesForReassignment.length > 0}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Skeleton Loader ---
const SettingsPageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-8 w-1/4" /> {/* Title */}

     {/* Appearance Skeleton */}
    <Card className="bg-card border-border/20 shadow-md glow-border">
      <CardHeader>
        <Skeleton className="h-6 w-1/4 mb-1" /> {/* Card Title */}
        <Skeleton className="h-4 w-3/5" /> {/* Card Description */}
      </CardHeader>
      <CardContent className="space-y-4 glow-border-inner p-4">
        <Skeleton className="h-4 w-1/5 mb-2" /> {/* Label "Select Theme" */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center p-3 h-24 rounded-lg border-2 border-muted-foreground/30 glow-border-inner">
              <Skeleton className="w-8 h-8 rounded-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Currency Skeleton */}
    <Card className="bg-card border-border/20 shadow-md glow-border">
      <CardHeader>
        <Skeleton className="h-6 w-1/5 mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4 glow-border-inner p-4">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full rounded-md glow-border-inner" />
          <Skeleton className="h-3 w-2/3 mt-1" />
        </div>
      </CardContent>
    </Card>

    {/* Category Skeleton */}
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
              {[1, 2, 3].map(i => (
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
