
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/context/app-context';
import type { Currency } from '@/services/currency';
import { getSupportedCurrencies } from '@/services/currency';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Search } from 'lucide-react';

export default function CurrencyPage() {
  const { state, dispatch, isLoading: contextLoading } = useAppContext();
  const { toast } = useToast();
  const [supportedCurrencies, setSupportedCurrencies] = useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSelectCurrency = (currency: Currency) => {
    dispatch({ type: 'SET_CURRENCY', payload: currency });
    toast({
      title: "Currency Updated",
      description: `Currency set to ${currency.name} (${currency.code}).`,
      variant: "default",
      className: "bg-primary/10 border-primary text-primary-foreground",
    });
  };

  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) {
      return supportedCurrencies;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return supportedCurrencies.filter(currency =>
      currency.name.toLowerCase().includes(lowerCaseSearch) ||
      currency.code.toLowerCase().includes(lowerCaseSearch) ||
      currency.symbol.includes(searchTerm) // Include symbol search
    );
  }, [searchTerm, supportedCurrencies]);

  const isLoading = contextLoading || isLoadingCurrencies;

  if (isLoading) {
    return <CurrencyPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Select Currency</h1>

      <Card className="bg-card border-primary/30 shadow-neon overflow-hidden"> {/* Prevent shadow clipping */}
        <CardHeader>
          <CardTitle className="text-secondary">Choose Your Currency</CardTitle>
          <CardDescription>Select the currency for displaying prices and budget.</CardDescription>
           {/* Search Input */}
            <div className="relative pt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search currency (e.g., USD, Euro, $)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-secondary/50 focus:border-secondary focus:shadow-secondary focus:ring-secondary"
                />
            </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-25rem)] sm:h-[calc(100vh-22rem)]"> {/* Adjust height as needed */}
            {filteredCurrencies.length > 0 ? (
                <ul className="space-y-2 pr-4">
                    {filteredCurrencies.map((currency) => (
                    <li key={currency.code}>
                        <Button
                        variant={state.currency.code === currency.code ? "default" : "outline"}
                        className={`w-full justify-start text-left h-auto py-2 px-3 border-primary/30 hover:border-primary ${state.currency.code === currency.code ? 'bg-primary text-primary-foreground shadow-neon cursor-default' : 'hover:bg-primary/10'}`}
                        onClick={() => handleSelectCurrency(currency)}
                        disabled={state.currency.code === currency.code}
                        >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                            <span className="font-medium text-sm">{currency.name}</span>
                            <span className="text-xs opacity-80">{currency.code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">{currency.symbol}</span>
                                {state.currency.code === currency.code && (
                                    <CheckCircle className="h-5 w-5 text-primary-foreground" />
                                )}
                            </div>
                        </div>
                        </Button>
                    </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground text-center py-4">No currencies found matching "{searchTerm}".</p>
            )}

          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}


const CurrencyPageSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-1/3" /> {/* Title */}

        <Card className="bg-card border-border/20 shadow-md overflow-hidden">
            <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-1" /> {/* Card Title */}
                <Skeleton className="h-4 w-3/4" /> {/* Card Description */}
                 <div className="relative pt-4">
                    <Skeleton className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                    <Skeleton className="h-10 w-full rounded-md pl-10" /> {/* Search Input */}
                 </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[calc(100vh-25rem)] sm:h-[calc(100vh-22rem)]">
                    <ul className="space-y-2 pr-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                        <li key={i}>
                             <Skeleton className="h-16 w-full rounded-md" /> {/* Button Skeleton */}
                        </li>
                        ))}
                    </ul>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
);

