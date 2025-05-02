
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Wallet, Coins, Info } from 'lucide-react'; // Removed TrendingUp, added Info
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription, // Added DialogDescription
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // Import date-fns for date formatting
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Added Tooltip

const budgetSchema = z.object({
    limit: z.number().min(0, "Budget limit cannot be negative"),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export const BudgetPanel: React.FC = () => {
  const { state, dispatch, formatCurrency, isLoading } = useAppContext();
  const { budget } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>(''); // State to hold formatted current date

  // Update currentDate when component mounts and potentially if date changes (though unlikely needed frequently here)
    useEffect(() => {
        setCurrentDate(format(new Date(), 'yyyy-MM-dd'));
    }, []);

  // Reset budget if the date changes (user opens app on a new day)
    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        if (!isLoading && budget.lastSetDate && budget.lastSetDate !== today) {
            // Reset budget limit and spent for the new day, keep spent calculation logic
            dispatch({ type: 'RESET_DAILY_BUDGET' });
            // Optionally notify user:
            // toast({ title: "New Day!", description: "Your daily budget has been reset." });
        }
    }, [isLoading, budget.lastSetDate, dispatch]);


  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormData>({
      resolver: zodResolver(budgetSchema),
      defaultValues: {
          limit: 0, // Initialized below
      }
  });

  useEffect(() => {
    // Update form default value when budget limit changes from context *or* when dialog opens
    if (!isLoading) {
        reset({ limit: budget.limit || 0 });
    }
  }, [budget.limit, reset, isLoading, isEditing]); // Depend on isEditing to reset when dialog opens


  const spentPercentage = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
  const remaining = budget.limit - budget.spent;
  const isOverBudget = remaining < 0;


   const handleSaveBudget = (data: BudgetFormData) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      dispatch({ type: 'SET_BUDGET_LIMIT', payload: { limit: data.limit, date: today } });
      setIsEditing(false); // Close the dialog
   };

  if (isLoading) {
      return <BudgetPanelSkeleton />
  }

  const budgetDateLabel = budget.lastSetDate ? format(new Date(budget.lastSetDate + 'T00:00:00'), 'MMM d, yyyy') : 'Not Set'; // Handle potential null date

  return (
    <Card className="w-full bg-card border-primary/30 shadow-neon mb-4 sm:mb-6">
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4 sm:pb-3 sm:pt-4 sm:px-6">
        <div className="flex items-center gap-2">
             <Wallet className="h-5 w-5 text-primary" />
             <CardTitle className="text-base sm:text-lg font-semibold text-primary">
                 Daily Budget {/* Changed Title */}
             </CardTitle>
             <TooltipProvider>
                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground ml-1">({budgetDateLabel})</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs bg-popover text-popover-foreground border-primary/30">
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
          <DialogContent className="w-[90vw] max-w-md sm:max-w-sm bg-card border-primary/40 shadow-neon rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-primary">Set Daily Budget Limit</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm pt-1">
                 This budget will apply for today ({format(new Date(), 'MMM d, yyyy')}) and resets automatically each day.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleSaveBudget)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="limit" className="text-right text-neonText/80 text-xs sm:text-sm">
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
                <span className={cn(isOverBudget ? 'text-destructive' : 'text-green-400')}>
                    Remaining Today:
                </span>
            </div>
             <div className={`text-base sm:text-xl font-bold ${isOverBudget ? 'text-destructive' : 'text-green-400'}`}>
                {formatCurrency(remaining)}
            </div>
         </div>
         {isOverBudget && (
            <p className="text-xs text-destructive/80 text-right">
                Over daily budget by {formatCurrency(Math.abs(remaining))}
            </p>
         )}
      </CardContent>
    </Card>
  );
};


const BudgetPanelSkeleton: React.FC = () => {
  return (
    <Card className="w-full bg-card border-border/20 shadow-md animate-pulse mb-4 sm:mb-6">
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
