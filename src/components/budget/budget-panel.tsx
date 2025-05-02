"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Wallet, TrendingUp, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const budgetSchema = z.object({
    limit: z.number().min(0, "Budget limit cannot be negative"),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export const BudgetPanel: React.FC = () => {
  const { state, dispatch, formatCurrency, isLoading } = useAppContext();
  const { budget } = state;
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormData>({
      resolver: zodResolver(budgetSchema),
      defaultValues: {
          limit: budget.limit || 0,
      }
  });

  useEffect(() => {
    // Update form default value when budget limit changes from context
    reset({ limit: budget.limit });
  }, [budget.limit, reset]);


  const spentPercentage = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
  const remaining = budget.limit - budget.spent;
  const isOverBudget = remaining < 0;


   const handleSaveBudget = (data: BudgetFormData) => {
      dispatch({ type: 'SET_BUDGET_LIMIT', payload: data.limit });
      setIsEditing(false); // Close the dialog
   };

  if (isLoading) {
      return <BudgetPanelSkeleton />
  }

  return (
    <Card className="w-full bg-card border-primary/30 shadow-neon mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
          <Wallet className="h-5 w-5" /> Budget Overview
        </CardTitle>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/70 hover:text-primary">
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit Budget</span>
              </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-primary/40 shadow-neon">
            <DialogHeader>
              <DialogTitle className="text-primary">Set Budget Limit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleSaveBudget)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="limit" className="text-right text-neonText/80">
                    Limit ({state.currency.symbol})
                  </Label>
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    {...register('limit', { valueAsNumber: true })}
                    className="col-span-3 border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary"
                    min="0"
                    aria-invalid={errors.limit ? "true" : "false"}
                  />
                  {errors.limit && <p className="col-span-4 text-red-500 text-xs text-right">{errors.limit.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="hover:bg-secondary/80">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow">Set Budget</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
         <div className="space-y-1">
             <div className="flex justify-between items-center text-sm text-muted-foreground">
                 <span>Spent: {formatCurrency(budget.spent)}</span>
                 <span>Limit: {formatCurrency(budget.limit)}</span>
             </div>
            <Progress
                value={spentPercentage}
                className={cn(
                    "h-3 bg-secondary/20",
                     isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
                )}
                aria-label={`${spentPercentage.toFixed(0)}% of budget spent`}
            />
              <p className={cn(
                  "text-xs text-right",
                   isOverBudget ? 'text-destructive/80' : 'text-muted-foreground'
               )}>
                 {spentPercentage.toFixed(1)}% Used
             </p>
        </div>

        {/* Remaining Amount */}
         <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-lg font-medium">
                 <Coins className={cn("h-5 w-5", isOverBudget ? 'text-destructive' : 'text-green-500')} />
                <span className={cn(isOverBudget ? 'text-destructive' : 'text-green-400')}>
                    Remaining:
                </span>
            </div>
             <div className={`text-xl font-bold ${isOverBudget ? 'text-destructive' : 'text-green-400'}`}>
                {formatCurrency(remaining)}
            </div>
         </div>
         {isOverBudget && (
            <p className="text-xs text-destructive/80 text-right">
                Over budget by {formatCurrency(Math.abs(remaining))}
            </p>
         )}
      </CardContent>
    </Card>
  );
};


const BudgetPanelSkeleton: React.FC = () => {
  return (
    <Card className="w-full bg-card border-border/20 shadow-md animate-pulse mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <Skeleton className="h-6 w-2/5" /> {/* Title */}
        <Skeleton className="h-7 w-7 rounded-md" /> {/* Edit Button */}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar Skeleton */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" /> {/* Progress Bar */}
          <Skeleton className="h-3 w-1/5 ml-auto" /> {/* Percentage Text */}
        </div>

        {/* Remaining Amount Skeleton */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          <Skeleton className="h-6 w-1/4" />
        </div>
      </CardContent>
    </Card>
  );
};

    