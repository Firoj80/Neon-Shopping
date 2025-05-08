"use client";
import React, { useEffect } from 'react';
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

// Form schema for item data, listId will be handled separately
const formSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").int(),
  price: z.number().min(0, "Price cannot be negative").nullable().default(0), // Allow null, default to 0
  category: z.string().min(1, "Category is required"), // Category is required
});

type FormData = z.infer<typeof formSchema>;

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave now receives data without listId, as it's passed separately or derived
  onSave: (data: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked' | 'listId'>) => void;
  itemData?: ShoppingListItem | null;
  currentListId: string | null; // ID of the currently selected list
}

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({ isOpen, onClose, onSave, itemData, currentListId }) => {
  const { state } = useAppContext();
  const { categories, currency } = state; // Get currency for label

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      price: null, // Default price to null initially to show placeholder
      category: '', // Initial default, will be updated by useEffect
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (itemData) { // Editing existing item
        reset({
          name: itemData.name,
          quantity: itemData.quantity,
          price: itemData.price, // Use the existing price
          category: itemData.category,
        });
      } else { // Adding new item
        // Get the selected list's default category
        const selectedListObject = state.lists.find(list => list.id === currentListId);
        const listDefaultCategory = selectedListObject?.defaultCategory || 'uncategorized'; // Default to uncategorized

        reset({
          name: '',
          quantity: 1,
          price: null, // Start with null to show placeholder
          // Use list's default category if available and valid, otherwise first category, else 'uncategorized'
           category: listDefaultCategory && categories.some(c => c.id === listDefaultCategory)
                    ? listDefaultCategory
                    : (categories.find(c => c.id !== 'uncategorized')?.id || 'uncategorized'),
        });
      }
    }
  }, [isOpen, itemData, reset, categories, currentListId, state.lists]);


  const onSubmit = (data: FormData) => {
    // Ensure price is 0 if null before saving
    const dataToSave = {
      ...data,
      price: data.price ?? 0,
    };
    // listId is handled by the parent component (ShoppingListPage) when dispatching ADD_SHOPPING_ITEM
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
                      // Allow empty input, otherwise parse as int, default to 1 if parsing fails or value < 1
                      field.onChange(value === '' ? '' : Math.max(1, parseInt(value, 10) || 1));
                    }}
                     value={field.value === 0 ? '' : field.value} // Show empty if 0 (though min is 1)
                     placeholder="1" // Placeholder for quantity
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
                         // Allow empty input, handle potential negative, parse as float
                         field.onChange(value === '' ? null : Math.max(0, parseFloat(value) || 0));
                       }}
                       value={field.value === null || field.value === undefined ? '' : field.value} // Show empty string if null/undefined
                       placeholder="0.00" // Use placeholder
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
            <Label htmlFor="category" className="text-neonText/80">Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // This value will be pre-filled by the useEffect
                  disabled={categories.filter(cat => cat.id !== 'uncategorized').length === 0} // Disable if only 'uncategorized' exists
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
                            // Disable the 'Uncategorized' option visually if it's the only one
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
              <Button type="button" variant="secondary" className="w-full sm:w-auto hover:bg-secondary/80 text-sm glow-border-inner">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow text-sm glow-border-inner">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
