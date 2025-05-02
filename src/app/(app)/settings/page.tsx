"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import type { Currency } from '@/services/currency';
import { getSupportedCurrencies } from '@/services/currency';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const settingsSchema = z.object({
  budgetLimit: z.number().min(0, "Budget must be non-negative"),
  currencyCode: z.string().min(1, "Currency is required"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { state, dispatch, isLoading: contextLoading } = useAppContext();
  const { toast } = useToast();
  const [supportedCurrencies, setSupportedCurrencies] = useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      budgetLimit: 0, // Initialized below
      currencyCode: '', // Initialized below
    }
  });

  // Fetch supported currencies on mount
    useEffect(() => {
        const fetchCurrencies = async () => {
            setIsLoadingCurrencies(true);
            try {
                const currencies = await getSupportedCurrencies();
                setSupportedCurrencies(currencies);
            } catch (error) {
                console.error("Failed to fetch supported currencies:", error);
                toast({
                    title: "Error",
                    description: "Could not load supported currencies.",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingCurrencies(false);
            }
        };
        fetchCurrencies();
    }, [toast]);


  // Initialize form values when context data is loaded
  useEffect(() => {
    if (!contextLoading) {
        reset({
            budgetLimit: state.budget.limit,
            currencyCode: state.currency.code,
        });
    }
  }, [contextLoading, state.budget.limit, state.currency.code, reset]);

  const onSubmit = (data: SettingsFormData) => {
    // Dispatch actions to update context state
    dispatch({ type: 'SET_BUDGET_LIMIT', payload: data.budgetLimit });

    const selectedCurrency = supportedCurrencies.find(c => c.code === data.currencyCode);
    if (selectedCurrency) {
        dispatch({ type: 'SET_CURRENCY', payload: selectedCurrency });
    }

    toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
        variant: "default", // Use default style (often green or neutral)
        className: "bg-primary/10 border-primary text-primary-foreground", // Custom neon success
    });
     reset(data); // Reset dirty state after successful save
  };

   const isLoading = contextLoading || isLoadingCurrencies;

  if (isLoading) {
      return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>

      <Card className="bg-card border-primary/30 shadow-neon">
        <CardHeader>
          <CardTitle className="text-secondary">Preferences</CardTitle>
          <CardDescription>Manage your budget and currency settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Budget Limit */}
            <div className="space-y-2">
              <Label htmlFor="budgetLimit" className="text-neonText/80">Budget Limit</Label>
              <Input
                id="budgetLimit"
                type="number"
                step="0.01"
                min="0"
                {...register('budgetLimit', { valueAsNumber: true })}
                className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary"
                aria-invalid={errors.budgetLimit ? "true" : "false"}
              />
              {errors.budgetLimit && <p className="text-red-500 text-xs">{errors.budgetLimit.message}</p>}
            </div>

            {/* Currency Selection */}
             <div className="space-y-2">
                <Label htmlFor="currencyCode" className="text-neonText/80">Currency</Label>
                <Controller
                    name="currencyCode"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCurrencies}>
                            <SelectTrigger
                             id="currencyCode"
                             className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary"
                             aria-invalid={errors.currencyCode ? "true" : "false"}
                             >
                            <SelectValue placeholder={isLoadingCurrencies ? "Loading currencies..." : "Select currency"} />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-primary/80 text-neonText max-h-60 overflow-y-auto">
                            {supportedCurrencies.map((currency) => (
                                <SelectItem
                                key={currency.code}
                                value={currency.code}
                                className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary"
                                >
                                {currency.name} ({currency.symbol})
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.currencyCode && <p className="text-red-500 text-xs">{errors.currencyCode.message}</p>}
            </div>

            {/* Save Button */}
             <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={!isDirty || isLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow disabled:opacity-50 disabled:shadow-none"
                    >
                    Save Settings
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Other settings sections can be added here (e.g., Categories Management, App Appearance) */}

    </div>
  );
}


const SettingsPageSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-1/4" /> {/* Title */}

         <Card className="bg-card border-border/20 shadow-md">
            <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-1" /> {/* Card Title */}
                <Skeleton className="h-4 w-1/2" /> {/* Card Description */}
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Budget Limit Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" /> {/* Label */}
                    <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
                </div>

                {/* Currency Selection Skeleton */}
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" /> {/* Label */}
                    <Skeleton className="h-10 w-full rounded-md" /> {/* Select */}
                 </div>


                {/* Save Button Skeleton */}
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-28 rounded-md" />
                </div>
            </CardContent>
         </Card>
    </div>
);
