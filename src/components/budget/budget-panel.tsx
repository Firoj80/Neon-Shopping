
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Wallet, Coins, Info } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const budgetSchema = z.object({
    limit: z.number().min(0, "Budget limit cannot be negative"),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export const BudgetPanel: React.FC = () => {
  const { state, dispatch, formatCurrency, isLoading } = useAppContext();
  const { budget } = state;
  const [isEditing, setIsEditing] = useState(false);
  // Moved useState hooks to the top level, before any conditional returns
  const [budgetDateLabel, setBudgetDateLabel] = useState('Not Set');
  const [todayFormatted, setTodayFormatted] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormData>({
      resolver: zodResolver(budgetSchema),
      defaultValues: {
          limit: 0,
      }
  });

  // Update form default value when budget limit changes from context *or* when dialog opens
  useEffect(() => {
    if (!isLoading && isEditing) {
        reset({ limit: budget.limit || 0 });
    } else if (!isLoading && !isEditing) {
         reset({ limit: budget.limit || 0 });
    }
  }, [budget.limit, reset, isLoading, isEditing]);


  // Format date for display, ensuring it's done client-side
   useEffect(() => {
       if (budget.lastSetDate) {
           try {
             setBudgetDateLabel(format(new Date(budget.lastSetDate + 'T00:00:00'), 'MMM d, yyyy'));
           } catch (e) {
             console.error("Error formatting budget date:", e);
             setBudgetDateLabel('Invalid Date');
           }
       } else {
           setBudgetDateLabel('Not Set');
       }
   }, [budget.lastSetDate]);

    // Format today's date for dialog description
    useEffect(() => {
        setTodayFormatted(format(new Date(), 'MMM d, yyyy'));
    }, []);


  if (isLoading) {
      return <BudgetPanelSkeleton />
  }

  // Calculations moved after the isLoading check
  const spentPercentage = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
  const remaining = budget.limit - budget.spent;
  const isOverBudget = remaining < 0;

   const handleSaveBudget = (data: BudgetFormData) => {
      const todayString = format(new Date(), 'yyyy-MM-dd');
      dispatch({ type: 'SET_BUDGET_LIMIT', payload: { limit: data.limit, date: todayString } });
      setIsEditing(false); // Close the dialog
   };


  return (
    // Card is full width by default due to parent flex/grid layout
    <Card className="w-full bg-card border-primary/30 shadow-neon glow-border mb-4 sm:mb-6"> {/* Added glow-border */}
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4 sm:pb-3 sm:pt-4 sm:px-6">
        <div className="flex items-center gap-2">
             <Wallet className="h-5 w-5 text-primary" />
             <CardTitle className="text-base sm:text-lg font-semibold text-primary">
                 Daily Budget
             </CardTitle>
             <TooltipProvider>
                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                         {/* Ensure span exists even if budgetDateLabel is loading */}
                         <span className="text-xs text-muted-foreground ml-1 min-h-[1rem]">
                            ({budgetDateLabel})
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs bg-popover text-popover-foreground border-primary/30 glow-border"> {/* Added glow-border */}
                        Budget set for {budgetDateLabel}. Resets daily.
                    </TooltipContent>
                </Tooltip>
             </TooltipProvider>
        </div>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/70 hover:text-primary">
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit Budget</span>
              </Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] max-w-md sm:max-w-sm bg-card border-primary/40 shadow-neon rounded-lg glow-border"> {/* Added glow-border */}
            <DialogHeader>
              <DialogTitle className="text-primary">Set Daily Budget Limit</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm pt-1">
                 {/* Use state for formatted date */}
                 This budget will apply for today ({todayFormatted}) and resets automatically each day.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleSaveBudget)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="limit" className="text-right text-neonText/80 text-xs sm:text-sm"> {/* Apply neonText */}
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
                    autoFocus // Focus input when dialog opens
                  />
                  {errors.limit && <p className="col-span-4 text-red-500 text-xs text-right">{errors.limit.message}</p>}
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="hover:bg-secondary/80 w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow w-full sm:w-auto">Set Budget</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
       <CardContent className="space-y-3 sm:space-y-4 px-4 pb-4 sm:px-6 sm:pb-5">
         <div className="space-y-1">
             <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
                 {/* Format currency values */}
                 <span>Spent Today: {formatCurrency(budget.spent)}</span>
                 <span>Daily Limit: {formatCurrency(budget.limit)}</span>
             </div>
            <Progress
                value={spentPercentage}
                className={cn(
                    "h-2 sm:h-3 bg-secondary/20",
                     isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
                )}
                aria-label={`${spentPercentage.toFixed(0)}% of budget spent`}
            />
              <p className={cn(
                  "text-xs text-right",
                   isOverBudget ? 'text-destructive/80' : 'text-muted-foreground'
               )}>
                 {spentPercentage.toFixed(1)}% Used Today
             </p>
        </div>

         <div className="flex items-center justify-between pt-1 sm:pt-2">
            <div className="flex items-center gap-2 text-sm sm:text-lg font-medium">
                 <Coins className={cn("h-4 w-4 sm:h-5 sm:w-5", isOverBudget ? 'text-destructive' : 'text-green-500')} />
                <span className={cn("text-neonText", isOverBudget ? 'text-destructive' : 'text-green-400')}> {/* Apply neonText conditionally */}
                    Remaining Today:
                </span>
            </div>
             <div className={cn("text-base sm:text-xl font-bold", isOverBudget ? 'text-destructive' : 'text-green-400')}> {/* Apply theme colors */}
                {/* Format remaining currency */}
                {formatCurrency(remaining)}
            </div>
         </div>
         {isOverBudget && (
            <p className="text-xs text-destructive/80 text-right">
                 {/* Format over budget amount */}
                Over daily budget by {formatCurrency(Math.abs(remaining))}
            </p>
         )}
      </CardContent>
    </Card>
  );
};


const BudgetPanelSkeleton: React.FC = () => {
  return (
    <Card className="w-full bg-card border-border/20 shadow-md animate-pulse mb-4 sm:mb-6 glow-border"> {/* Added glow-border */}
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4 sm:pb-3 sm:pt-4 sm:px-6">
        <div className="flex items-center gap-2 w-3/5">
            <Skeleton className="h-5 w-5 rounded-full" /> {/* Icon */}
            <Skeleton className="h-5 w-3/5" /> {/* Title */}
            <Skeleton className="h-3 w-1/4" /> {/* Date placeholder */}
        </div>
        <Skeleton className="h-7 w-7 rounded-md" /> {/* Edit Button */}
      </CardHeader>
       <CardContent className="space-y-3 sm:space-y-4 px-4 pb-4 sm:px-6 sm:pb-5">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-1/4 sm:h-4" />
            <Skeleton className="h-3 w-1/4 sm:h-4" />
          </div>
          <Skeleton className="h-2 sm:h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-1/5 ml-auto" />
        </div>
         <div className="flex items-center justify-between pt-1 sm:pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full" />
            <Skeleton className="h-4 w-1/3 sm:h-5" />
          </div>
          <Skeleton className="h-5 w-1/4 sm:h-6" />
        </div>
      </CardContent>
    </Card>
  );
};
