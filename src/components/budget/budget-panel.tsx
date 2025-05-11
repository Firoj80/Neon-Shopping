// src/components/budget/budget-panel.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from '@/context/app-context';
import type { List, ShoppingListItem } from '@/context/app-context';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Wallet, Coins, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { startOfDay, isSameDay } from 'date-fns';

const budgetFormSchema = z.object({
  budgetLimit: z.number().min(0, "Budget limit cannot be negative").nullable().default(0),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

export const BudgetCardSkeleton: React.FC = () => { // Added export
  return (
    <Card className="w-full bg-card border-border/20 shadow-md animate-pulse mb-1 sm:mb-2 glow-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3 sm:px-4">
        <div className="flex items-center gap-2 w-3/5">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex flex-col gap-1 w-full">
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Skeleton className="h-7 w-20 rounded-md self-center" />
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2 sm:px-4 sm:pb-3 glow-border-inner">
        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full glow-border-inner" />
          <Skeleton className="h-3 w-1/5 ml-auto" />
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
          <Skeleton className="h-4 w-1/4" />
        </div>
      </CardContent>
    </Card>
  );
};

export const BudgetCard: React.FC = () => {
  const { state, dispatch, formatCurrency, isLoading } = useAppContext();
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  const selectedList: List | undefined = useMemo(() => {
    if (!Array.isArray(state.lists)) return undefined;
    return state.lists.find(list => list.id === state.selectedListId);
  }, [state.lists, state.selectedListId]);

  const itemsForSelectedList: ShoppingListItem[] = useMemo(() => {
    if (!selectedList || !Array.isArray(state.shoppingListItems)) return [];
    return state.shoppingListItems.filter(item => item.listId === selectedList.id);
  }, [state.shoppingListItems, selectedList]);

  const today = startOfDay(new Date());
  const spentForSelectedList: number = useMemo(() => {
    if (!selectedList) return 0;
    return itemsForSelectedList
      .filter(item => item.checked /* && isSameDay(new Date(item.dateAdded), today) */) // Daily reset logic commented out for now
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [itemsForSelectedList, selectedList/*, today*/]);


  const { control, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      budgetLimit: selectedList?.budgetLimit ?? null,
    }
  });

  useEffect(() => {
    if (selectedList) {
      reset({ budgetLimit: selectedList.budgetLimit === 0 ? null : selectedList.budgetLimit });
    } else {
      reset({ budgetLimit: null });
    }
  }, [selectedList, reset]);

  if (isLoading || !selectedList) {
    return <BudgetCardSkeleton />;
  }

  const budgetLimit = selectedList.budgetLimit || 0;
  const spentPercentage = budgetLimit > 0 ? Math.min((spentForSelectedList / budgetLimit) * 100, 100) : 0;
  const remaining = budgetLimit - spentForSelectedList;
  const isOverBudget = remaining < 0;

  const handleSaveBudget = (data: BudgetFormData) => {
    if (selectedList) {
      dispatch({
        type: 'UPDATE_LIST',
        payload: { ...selectedList, budgetLimit: data.budgetLimit ?? 0 }
      });
    }
    setIsEditingBudget(false);
  };

  const budgetLimitDisplay = formatCurrency(budgetLimit);

  return (
    <Card className="w-full bg-card border-primary/30 shadow-neon glow-border-inner mb-1 sm:mb-2 h-auto min-h-[auto]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3 sm:px-4">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <div className="flex-grow min-w-0">
            <CardTitle className="text-sm sm:text-base font-semibold text-primary leading-tight truncate">
              Budget: <span className="text-secondary truncate">{selectedList.name}</span>
            </CardTitle>
          </div>
        </div>
         <div className="flex items-center">
             <span className="text-xs text-muted-foreground mr-2">
                 Limit: {budgetLimitDisplay}
             </span>
            <Dialog open={isEditingBudget} onOpenChange={setIsEditingBudget}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary/80 hover:text-primary hover:bg-primary/10 glow-border-inner text-xs px-1.5 py-1 h-auto sm:px-2">
                <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md sm:max-w-sm bg-card border-primary/40 shadow-neon rounded-lg glow-border">
                <DialogHeader>
                <DialogTitle className="text-primary">Set Budget for "{selectedList.name}"</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm pt-1">
                    This budget limit applies to the selected shopping list.
                </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleSaveBudget)}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="budgetLimit" className="text-right text-neonText/80 text-xs sm:text-sm">
                        Limit ({state.currency.symbol})
                    </Label>
                    <Controller
                        name="budgetLimit"
                        control={control}
                        render={({ field }) => (
                        <Input
                            id="budgetLimit"
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === '' ? null : Math.max(0, parseFloat(value) || 0));
                            }}
                            value={field.value === null || field.value === undefined ? '' : String(field.value)}
                            placeholder="0.00"
                            className="col-span-3 border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner"
                            min="0"
                            aria-invalid={errors.budgetLimit ? "true" : "false"}
                            autoFocus
                        />
                        )}
                    />
                    {errors.budgetLimit && <p className="col-span-4 text-red-500 text-xs text-right">{errors.budgetLimit.message}</p>}
                    </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <DialogClose asChild>
                    <Button type="button" variant="secondary" className="hover:bg-secondary/80 w-full sm:w-auto glow-border-inner">
                        Cancel
                    </Button>
                    </DialogClose>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow w-full sm:w-auto glow-border-inner">Set Budget</Button>
                </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>
         </div>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2 sm:px-4 sm:pb-3 glow-border-inner">
        <div className="space-y-0.5">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Spent: {formatCurrency(spentForSelectedList)}</span>
          </div>
          <Progress
            value={spentPercentage}
            className={cn(
              "h-1.5 bg-secondary/20 glow-border-inner",
              isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
            )}
            aria-label={`${spentPercentage.toFixed(0)}% of budget spent`}
          />
          {budgetLimit > 0 && (
            <p className={cn(
              "text-xs text-right",
              isOverBudget ? 'text-destructive/80' : 'text-muted-foreground'
            )}>
              {spentPercentage.toFixed(1)}% Used
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Coins className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", isOverBudget && budgetLimit > 0 ? 'text-destructive' : 'text-primary')} />
            <span className={cn("text-neonText text-xs")}>
              {budgetLimit > 0 ? 'Remaining:' : 'Total Spent:'}
            </span>
          </div>
          <div className={cn("text-sm font-bold", isOverBudget && budgetLimit > 0 ? 'text-destructive' : 'text-primary')}>
            {budgetLimit > 0 ? formatCurrency(remaining) : formatCurrency(spentForSelectedList)}
          </div>
        </div>
        {isOverBudget && budgetLimit > 0 && (
          <p className="text-xs text-destructive/80 text-right -mt-1">
            Over budget by {formatCurrency(Math.abs(remaining))}
          </p>
        )}
      </CardContent>
    </Card>
  );
};