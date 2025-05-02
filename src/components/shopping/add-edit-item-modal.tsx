
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
import { itemCategories } from '@/config/categories'; // Import categories from config
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea for potentially long lists

const formSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").int(),
  price: z.number().min(0, "Price cannot be negative"),
  category: z.string().min(1, "Category is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked'>) => void;
  itemData?: ShoppingListItem | null;
}

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({ isOpen, onClose, onSave, itemData }) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      price: 0,
      category: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
        if (itemData) {
            // Pre-fill form if editing
            reset({
                name: itemData.name,
                quantity: itemData.quantity,
                price: itemData.price,
                category: itemData.category,
            });
        } else {
            // Reset form if adding new item
            reset({
                name: '',
                quantity: 1,
                price: 0,
                category: '',
            });
        }
    }
  }, [isOpen, itemData, reset]);


  const onSubmit = (data: FormData) => {
    onSave(data);
  };

  // Ensure modal state correctly closes the dialog
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Adjust modal width for better mobile view */}
      <DialogContent className="w-[90vw] max-w-md bg-card border-primary/40 shadow-neon rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-primary text-lg sm:text-xl">{itemData ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>
        {/* Use grid with adjusted columns for better mobile layout */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-4 sm:p-6">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-neonText/80">
              Name
            </Label>
            <Input
              id="name"
              {...register('name')}
              className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary text-sm"
              aria-invalid={errors.name ? "true" : "false"}
            />
             {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="quantity" className="text-neonText/80">
                Quantity
                </Label>
                <Input
                id="quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary text-sm"
                min="1"
                aria-invalid={errors.quantity ? "true" : "false"}
                />
                {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
            </div>
             <div className="grid gap-2">
                <Label htmlFor="price" className="text-neonText/80">
                Price (each)
                </Label>
                <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary text-sm"
                min="0"
                aria-invalid={errors.price ? "true" : "false"}
                />
                {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category" className="text-neonText/80">
              Category
            </Label>
             <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} >
                        <SelectTrigger
                         id="category"
                         className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary text-sm" // Ensure consistent font size
                         aria-invalid={errors.category ? "true" : "false"}
                         >
                        <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                         {/* Ensure content area is scrollable and has enough height */}
                         <SelectContent
                            className="bg-card border-primary/80 text-neonText"
                            position="popper" // Try popper positioning for better viewport fit
                            sideOffset={5}
                         >
                             <ScrollArea className="h-[200px] w-full"> {/* Wrap in ScrollArea */}
                                 <SelectGroup>
                                    <SelectLabel className="text-muted-foreground/80 text-xs px-2">Categories</SelectLabel>
                                    {itemCategories.map((category) => (
                                        <SelectItem
                                            key={category}
                                            value={category}
                                            // Increase padding for touch targets
                                            className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-sm"
                                        >
                                            {category}
                                        </SelectItem>
                                    ))}
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
                <Button type="button" variant="secondary" className="w-full sm:w-auto hover:bg-secondary/80 text-sm">
                    Cancel
                </Button>
             </DialogClose>
            <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow text-sm">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
