// src/components/shopping/add-edit-item-modal.tsx
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
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectValue
} from '@/components/ui/select';
import type { ShoppingListItem } from '@/context/app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/context/app-context';
// import { fetchFromApi } from '@/lib/api'; // Removed API import
// import { useAuth } from '@/context/auth-context'; // Removed Auth import
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs
import { cn } from '@/lib/utils';


const formSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").int(),
  price: z.preprocess( 
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().min(0, "Price cannot be negative").nullable().default(0)
  ),
  category: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemData?: ShoppingListItem | null;
  currentListId: string | null;
}

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({ isOpen, onClose, itemData, currentListId }) => {
  const { state: appState, dispatch } = useAppContext();
  const { categories, currency, lists, userId } = appState; // Use userId from appState
  // const { user } = useAuth(); // Removed Auth
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      price: null,
      category: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (itemData) {
        reset({
          name: itemData.name,
          quantity: itemData.quantity,
          price: itemData.price === 0 ? null : itemData.price,
          category: itemData.category,
        });
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
      }
    }
  }, [isOpen, itemData, reset, categories, currentListId, lists]);

  const onSubmit = (data: FormData) => { // Removed async
    if (!currentListId || !userId) {
      toast({ title: "Error", description: "List or user not identified. Cannot save item.", variant: "destructive" });
      return;
    }

    const payload: ShoppingListItem = {
      id: itemData ? itemData.id : uuidv4(),
      listId: currentListId,
      userId: userId, 
      name: data.name,
      quantity: data.quantity,
      price: data.price ?? 0,
      category: data.category,
      checked: itemData ? itemData.checked : false,
      dateAdded: itemData ? itemData.dateAdded : Date.now(),
    };

    // Local storage version: dispatch directly
    if (itemData) {
      dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload });
      toast({ title: "Success", description: "Item updated." });
    } else {
      dispatch({ type: 'ADD_SHOPPING_ITEM', payload });
      toast({ title: "Success", description: "Item added." });
    }
    onClose();
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
                      field.onChange(value === '' ? 1 : Math.max(1, parseInt(value, 10) || 1));
                    }}
                     value={field.value === 0 ? '' : String(field.value)}
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
            </Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || 'uncategorized'} 
                  disabled={categories.filter(cat => cat.id !== 'uncategorized' && cat.userId === userId).length === 0 && field.value === 'uncategorized' && !categories.some(c=>c.id === 'uncategorized' && c.userId === null) }
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
                        {/* Filter categories to show global defaults (userId: null) and user-specific ones */}
                        {categories.filter(cat => cat.userId === null || cat.userId === userId).map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className={cn(
                                "focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-sm",
                                category.id === 'uncategorized' && "text-muted-foreground"
                            )}
                            // Disable 'uncategorized' if it's the only option and it's a global default (user has no custom categories)
                            disabled={category.id === 'uncategorized' && categories.filter(c => c.userId === userId).length === 0 && category.userId === null}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                         {categories.filter(cat => cat.userId === null || cat.userId === userId).length === 0 && (
                           <SelectItem value="no-categories" disabled className="text-muted-foreground text-center py-2 text-sm">
                                No categories defined.
                           </SelectItem>
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
