"use client";
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import type { List, Category } from '@/context/app-context';
import { useAppContext } from '@/context/app-context';

const listFormSchema = z.object({
  name: z.string().min(1, "List name is required").max(50, "List name too long"),
  budgetLimit: z.number().min(0, "Budget limit cannot be negative"),
  defaultCategory: z.string().optional(), // Add default category
});

type ListFormData = z.infer<typeof listFormSchema>;

interface AddEditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listData?: List | null; // Existing list data for editing
}

export const AddEditListModal: React.FC<AddEditListModalProps> = ({ isOpen, onClose, listData }) => {
  const { dispatch, state } = useAppContext();
  const { categories } = state;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ListFormData>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      name: '',
      budgetLimit: 0,
      defaultCategory: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (listData) {
        reset({
          name: listData.name,
          budgetLimit: listData.budgetLimit,
          defaultCategory: listData.defaultCategory || '',
        });
      } else {
        reset({ // Defaults for new list
          name: '',
          budgetLimit: 0,
          defaultCategory: categories.length > 0 ? categories[0].id : '',
        });
      }
    }
  }, [isOpen, listData, reset, categories]);

  const onSubmit = (data: ListFormData) => {
    if (listData) { // Editing existing list
      dispatch({ type: 'UPDATE_LIST', payload: { ...listData, ...data } });
      // TODO: Firebase - updateListInFirestore({ ...listData, ...data });
    } else { // Adding new list
      dispatch({ type: 'ADD_LIST', payload: data });
      // TODO: Firebase - addListToFirestore(data);
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
      <DialogContent className="w-[90vw] max-w-md bg-card border-secondary/40 shadow-neon rounded-lg glow-border">
        <DialogHeader>
          <DialogTitle className="text-secondary text-lg sm:text-xl">{listData ? 'Edit List' : 'Create New List'}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm pt-1">
            {listData ? 'Update the details for your shopping list.' : 'Enter details for your new shopping list.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-4 sm:p-6">
          <div className="grid gap-2">
            <Label htmlFor="listName" className="text-neonText/80">List Name</Label>
            <Input
              id="listName"
              {...register('name')}
              placeholder="e.g., Weekly Groceries, Tech Upgrades"
              className="border-secondary/50 focus:border-secondary focus:shadow-neon focus:ring-secondary text-sm glow-border-inner"
              aria-invalid={errors.name ? "true" : "false"}
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="listBudgetLimit" className="text-neonText/80">Budget Limit ({state.currency.symbol})</Label>
            <Input
              id="listBudgetLimit"
              type="number"
              step="0.01"
              {...register('budgetLimit', { valueAsNumber: true })}
              placeholder="e.g., 150"
              className="border-secondary/50 focus:border-secondary focus:shadow-neon focus:ring-secondary text-sm glow-border-inner"
              min="0"
              aria-invalid={errors.budgetLimit ? "true" : "false"}
            />
            {errors.budgetLimit && <p className="text-red-500 text-xs">{errors.budgetLimit.message}</p>}
          </div>

           <div className="grid gap-2">
            <Label htmlFor="defaultCategory" className="text-neonText/80">Default Category</Label>
            <SelectTrigger className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary text-sm glow-border-inner"
                             aria-invalid={errors.defaultCategory ? "true" : "false"}>
                <SelectValue placeholder="Select a default category" />
            </SelectTrigger>
            <SelectContent>
            {state.categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                    {category.name}
                </SelectItem>
             ))}
            </SelectContent>
           </div>

          <DialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto hover:bg-muted/20 text-sm glow-border-inner">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-neon hover:shadow-lg hover:shadow-secondary/50 transition-shadow text-sm glow-border-inner">
              {listData ? 'Save Changes' : 'Create List'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
