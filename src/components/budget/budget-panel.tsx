"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2 } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

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
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card border-primary/30 shadow-neon">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">Total Budget</CardTitle>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-primary/70 hover:text-primary">
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
        <CardContent>
          <div className="text-2xl font-bold text-neonText">{formatCurrency(budget.limit)}</div>
          <p className="text-xs text-muted-foreground">
            Your spending limit
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-secondary/30 shadow-neon">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-secondary">Spent So Far</CardTitle>
           {/* Optional icon like TrendingUp */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neonText">{formatCurrency(budget.spent)}</div>
           <Progress
            value={spentPercentage}
            className="h-2 mt-2 bg-secondary/20 [&>div]:bg-secondary"
            aria-label={`${spentPercentage.toFixed(0)}% of budget spent`}
            />
            <p className="text-xs text-muted-foreground mt-1">
                {spentPercentage.toFixed(1)}% of budget used
            </p>
        </CardContent>
      </Card>

       <Card className={`bg-card border-${isOverBudget ? 'destructive' : 'green-500'}/30 shadow-neon`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${isOverBudget ? 'text-destructive' : 'text-green-500'}`}>Remaining</CardTitle>
          {/* Optional icon */}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isOverBudget ? 'text-destructive' : 'text-green-400'}`}>
            {formatCurrency(remaining)}
            </div>
          <p className={`text-xs ${isOverBudget ? 'text-destructive/80' : 'text-muted-foreground'}`}>
             {isOverBudget ? `Over budget by ${formatCurrency(Math.abs(remaining))}` : "Left to spend"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};


const BudgetPanelSkeleton: React.FC = () => {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-card border-border/20 shadow-md animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-3 w-3/4" />
            {i === 2 && <Skeleton className="h-2 w-full mt-2" />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
