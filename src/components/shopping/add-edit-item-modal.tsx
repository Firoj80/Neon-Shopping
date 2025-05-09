"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';
import type { ShoppingListItem } from '@/context/app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/context/app-context';
import { suggestCategory, type SuggestCategoryInput, type SuggestCategoryOutput } from '@/ai/flows/suggest-category-flow'; // Import AI flow

// Form schema for item data, listId will be handled separately
const formSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").int(),
  price: z.number().min(0, "Price cannot be negative").nullable().default(0),
  category: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked' | 'listId' | 'userId'>) => void;
  itemData?: ShoppingListItem | null;
  currentListId: string | null;
}

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({ isOpen, onClose, onSave, itemData, currentListId }) => {
  const { state: appContextState } = useAppContext();
  const { categories, currency, lists } = appContextState;

  const { register, handleSubmit, control, reset, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      price: null,
      category: '',
    }
  });

  const watchedName = watch("name");
  const [itemNameForSuggestion, setItemNameForSuggestion] = useState('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAISuggesting, setIsAISuggesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (itemData) {
        reset({
          name: itemData.name,
          quantity: itemData.quantity,
          price: itemData.price,
          category: itemData.category,
        });
        setItemNameForSuggestion(''); // Don't suggest for existing items on open
      } else {
        const selectedListObject = lists.find(list => list.id === currentListId);
        const listDefaultCategory = selectedListObject?.defaultCategory || 'uncategorized';
        
        reset({
          name: '',
          quantity: 1,
          price: null,
          category: listDefaultCategory && categories.some(c => c.id === listDefaultCategory)
                    ? listDefaultCategory
                    : (categories.find(c => c.id !== 'uncategorized')?.id || 'uncategorized'),
        });
        setItemNameForSuggestion(''); // Reset for new item
      }
    }
  }, [isOpen, itemData, reset, categories, currentListId, lists]);

  // Effect for AI category suggestion
  useEffect(() => {
    if (!isOpen || itemData) { // Don't suggest if modal is closed or editing an existing item
        setItemNameForSuggestion(''); // Clear suggestion trigger when modal closes or on edit
        return;
    }
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (itemNameForSuggestion.trim()) {
      debounceTimeoutRef.current = setTimeout(async () => {
        setIsAISuggesting(true);
        try {
          const availableCategories = categories.map(c => ({ id: c.id, name: c.name }));
          if (availableCategories.length === 0) {
            setIsAISuggesting(false);
            return;
          }

          const result = await suggestCategory({ itemName: itemNameForSuggestion.trim(), availableCategories });
          if (result && result.suggestedCategoryId) {
            const isValidSuggestion = availableCategories.some(cat => cat.id === result.suggestedCategoryId);
            if (isValidSuggestion) {
              setValue('category', result.suggestedCategoryId, { shouldValidate: true });
            }
          }
        } catch (error) {
          console.error("Error suggesting category:", error);
          // Optionally set a default or do nothing
        } finally {
          setIsAISuggesting(false);
        }
      }, 700); // 700ms debounce
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [itemNameForSuggestion, categories, setValue, isOpen, itemData]);

  useEffect(() => {
    // Sync internal state for suggestion with react-hook-form's watched name
    // Only if not editing, to prevent re-triggering suggestion when form loads with existing data
    if (isOpen && !itemData) { 
        setItemNameForSuggestion(watchedName || '');
    }
  }, [watchedName, isOpen, itemData]);


  const onSubmit = (data: FormData) => {
    const dataToSave = {
      ...data,
      price: data.price ?? 0,
    };
    onSave(dataToSave);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[90vw] max-w-md bg-card border-primary/40 shadow-neon rounded-lg glow-border">
        <DialogHeader>
          <DialogTitle className="text-primary text-lg sm:text-xl">{itemData ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-4 sm:p-6">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-neonText/80">Name</Label>
            <Input
              id="name"
              {...register('name')}
              className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary text-sm glow-border-inner"
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity" className="text-neonText/80">Quantity</Label>
              <Controller
                name="quantity"
                control={control}
                defaultValue={1}
                render={({ field }) => (
                  <Input
                    id="quantity"
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? '' : Math.max(1, parseInt(value, 10) || 1));
                    }}
                    value={field.value === 0 ? '' : field.value}
                    placeholder="1"
                    className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary text-sm glow-border-inner"
                    min="1"
                    aria-invalid={errors.quantity ? "true" : "false"}
                  />
                )}
              />
              {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price" className="text-neonText/80">Price ({currency.symbol})</Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? null : Math.max(0, parseFloat(value) || 0));
                    }}
                    value={field.value === null || field.value === undefined ? '' : String(field.value)}
                    placeholder="0.00"
                    className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary text-sm glow-border-inner"
                    min="0"
                    aria-invalid={errors.price ? "true" : "false"}
                  />
                )}
              />
              {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category" className="text-neonText/80 flex items-center">
              Category
              {isAISuggesting && <span className="ml-2 text-xs text-primary animate-pulse">(AI suggesting...)</span>}
            </Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={categories.filter(cat => cat.id !== 'uncategorized').length === 0 && field.value === 'uncategorized'}
                >
                  <SelectTrigger
                    id="category"
                    className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary text-sm glow-border-inner"
                    aria-invalid={errors.category ? "true" : "false"}
                  >
                    <SelectValue placeholder={categories.length > 0 ? "Select a category" : "No categories available"} />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-card border-primary/80 text-neonText glow-border-inner"
                    position="popper"
                    sideOffset={5}
                  >
                    <ScrollArea className="h-[200px] w-full">
                      <SelectGroup>
                        <SelectLabel className="text-muted-foreground/80 text-xs px-2">Categories</SelectLabel>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-sm"
                            disabled={category.id === 'uncategorized' && categories.length <= 1}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                        {categories.filter(cat => cat.id !== 'uncategorized').length === 0 && (
                          <p className='text-center text-muted-foreground text-xs p-2'>No other categories defined. Add some in Settings!</p>
                        )}
                      </SelectGroup>
                    </ScrollArea>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
          </div>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto hover:bg-muted/20 text-sm glow-border-inner">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow text-sm glow-border-inner">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
