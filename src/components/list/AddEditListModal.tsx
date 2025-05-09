// src/components/list/AddEditListModal.tsx
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
  DialogDescription,
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
import type { List, Category } from '@/context/app-context';
import { useAppContext, FREEMIUM_LIST_LIMIT } from '@/context/app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname and useRouter

const listFormSchema = z.object({
  name: z.string().min(1, "List name is required").max(50, "List name too long"),
  budgetLimit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().min(0, "Budget limit cannot be negative").nullable().default(null)
  ),
  defaultCategory: z.string().optional().default('uncategorized'),
});

type ListFormData = z.infer<typeof listFormSchema>;

interface AddEditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listData?: List | null;
}

export const AddEditListModal: React.FC<AddEditListModalProps> = ({ isOpen, onClose, listData }) => {
  const { dispatch, state: appState } = useAppContext();
  const { categories, currency, isPremium, lists } = appState;
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const pathname = usePathname(); // Initialize pathname

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ListFormData>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      name: '',
      budgetLimit: null,
      defaultCategory: 'uncategorized',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (listData) {
        reset({
          name: listData.name,
          budgetLimit: listData.budgetLimit === 0 ? null : listData.budgetLimit,
          defaultCategory: listData.defaultCategory || 'uncategorized',
        });
      } else {
        reset({
          name: '',
          budgetLimit: null,
          defaultCategory: 'uncategorized',
        });
      }
    }
  }, [isOpen, listData, reset]);

  const onSubmit = async (data: ListFormData) => {
    if (!user || !user.id) {
      toast({ title: "Error", description: "You must be logged in to save a list.", variant: "destructive" });
      onClose();
      return;
    }

    if (!isPremium && !listData && lists.filter(l => l.userId === user.id).length >= FREEMIUM_LIST_LIMIT) {
      toast({
        title: "List Limit Reached",
        description: (
          <div className="flex flex-col gap-2">
            <span>You've reached the freemium limit of {FREEMIUM_LIST_LIMIT} lists.</span>
            <Button asChild size="sm" className="mt-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              <Link href="/premium">Upgrade to Premium</Link>
            </Button>
          </div>
        ),
        variant: "default",
      });
      onClose();
      return;
    }

    const payloadForApi = {
      userId: user.id,
      id: listData ? listData.id : undefined,
      name: data.name,
      budgetLimit: data.budgetLimit ?? 0,
      defaultCategory: data.defaultCategory && categories.some(c => c.id === data.defaultCategory) ? data.defaultCategory : 'uncategorized',
    };

    const endpoint = listData ? 'lists/update_list.php' : 'lists/create_list.php';

    try {
      // Simulate API call for now since backend is not fully integrated
      // const result = await fetchFromApi(endpoint, {
      //   method: 'POST',
      //   body: JSON.stringify(payloadForApi),
      // });
      // if (!result.success) {
      //   throw new Error(result.message || 'Failed to save list');
      // }

      // Simulated API response:
      const simulatedResult = {
        success: true,
        list: {
          ...payloadForApi,
          id: listData ? listData.id : `list-${Date.now()}`, // Simulate ID generation
          userId: user.id // Ensure userId is correctly set
        } as List,
        message: listData ? "List updated successfully." : "List created successfully."
      };
      // End of simulation

      if (listData) {
        dispatch({ type: 'UPDATE_LIST', payload: simulatedResult.list });
        toast({ title: "Success", description: simulatedResult.message });
      } else {
        dispatch({ type: 'ADD_LIST', payload: simulatedResult.list });
        toast({ title: "Success", description: simulatedResult.message });
        
        // If a new list was created and we are on the create-first page, redirect
        if (pathname === '/list/create-first') {
          console.log("AddEditListModal: New list created, redirecting from /list/create-first to /list");
          router.replace('/list'); // Redirect to the main list page
        }
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving list:", error);
      toast({ title: "Error", description: error.message || 'Could not save list.', variant: "destructive" });
    }
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
            <Label htmlFor="listBudgetLimit" className="text-neonText/80">Budget Limit ({currency.symbol})</Label>
            <Controller
              name="budgetLimit"
              control={control}
              render={({ field }) => (
                <Input
                  id="listBudgetLimit"
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? null : Math.max(0, parseFloat(value) || 0));
                  }}
                  value={field.value === null || field.value === undefined ? '' : String(field.value)}
                  placeholder="0.00"
                  className="border-secondary/50 focus:border-secondary focus:shadow-neon focus:ring-secondary text-sm glow-border-inner"
                  min="0"
                  aria-invalid={errors.budgetLimit ? "true" : "false"}
                />
              )}
            />
            {errors.budgetLimit && <p className="text-red-500 text-xs">{errors.budgetLimit.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="defaultCategory" className="text-neonText/80">Default Category (Optional)</Label>
            <Controller
              name="defaultCategory"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || 'uncategorized'}
                >
                  <SelectTrigger
                    id="defaultCategory"
                    className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary text-sm glow-border-inner"
                    aria-invalid={errors.defaultCategory ? "true" : "false"}
                  >
                    <SelectValue placeholder="-- No Default --" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-card border-primary/80 text-neonText glow-border-inner"
                    position="popper"
                    sideOffset={5}
                  >
                    <ScrollArea className="h-[200px] w-full">
                      <SelectGroup>
                        <SelectLabel className="text-muted-foreground/80 text-xs px-2">Categories</SelectLabel>
                        <SelectItem
                            value="uncategorized"
                            className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-sm text-muted-foreground"
                        >
                             -- No Default --
                        </SelectItem>
                        {categories.filter(cat => cat.id !== 'uncategorized').map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-sm"
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                        {categories.filter(cat => cat.id !== 'uncategorized').length === 0 && <SelectItem value="no-cat-option" disabled className="text-center text-muted-foreground text-xs p-2">No custom categories defined.</SelectItem>}
                      </SelectGroup>
                    </ScrollArea>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.defaultCategory && <p className="text-red-500 text-xs">{errors.defaultCategory.message}</p>}
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