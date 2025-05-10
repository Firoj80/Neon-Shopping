
"use client";
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Currency } from '@/services/currency';
import { समर्थितमुद्राएँ, getUserCurrency, defaultCurrency } from '@/services/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, DollarSign, Info, Settings as SettingsIcon } from 'lucide-react'; // Renamed Settings to SettingsIcon
import { cn } from '@/lib/utils';
import { useClientOnly } from '@/hooks/use-client-only';

const SettingsPage: React.FC = () => {
  const { state, dispatch, isLoading: isAppContextLoading } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(state.currency);
  const isClient = useClientOnly();

  useEffect(() => {
    setSelectedCurrency(state.currency);
  }, [state.currency]);

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
  };

  const handleSaveCurrency = () => {
    dispatch({ type: 'SET_CURRENCY', payload: selectedCurrency });
    toast({
      title: "Currency Updated",
      description: `Currency changed to ${selectedCurrency.name} (${selectedCurrency.symbol}).`,
      className: "bg-primary text-primary-foreground border-primary/50 shadow-neon",
    });
  };
  
  const filteredCurrencies = समर्थितमुद्राएँ.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.includes(searchTerm)
  );

  if (!isClient || isAppContextLoading || !state.isInitialDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <SettingsIcon className="w-16 h-16 animate-pulse text-primary" />
        <p className="mt-4 text-lg font-semibold">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 sm:h-10 sm:h-10" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your application preferences.
        </p>
      </header>

      {/* Currency Settings Card */}
      <Card className="shadow-neon-sm border-primary/20 bg-card/80 backdrop-blur-sm card-glow">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <DollarSign className="mr-2 h-6 w-6" /> Currency
          </CardTitle>
          <CardDescription>
            Select your preferred currency for displaying prices and budgets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currency-search" className="text-neonText/80">Search Currency</Label>
            <Input
              id="currency-search"
              type="text"
              placeholder="e.g., USD, Euro, $"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary text-sm"
            />
          </div>
          <ScrollArea className="h-48 sm:h-64 rounded-md border border-border/30 p-2 bg-background/50 shadow-inner">
            <div className="space-y-1">
              {filteredCurrencies.map((currency) => (
                <Button
                  key={currency.code}
                  variant={selectedCurrency.code === currency.code ? 'secondary' : 'ghost'}
                  onClick={() => handleCurrencyChange(currency)}
                  className={cn(
                    "w-full justify-start text-left h-auto py-2 px-3 text-sm",
                    selectedCurrency.code === currency.code && "bg-primary/20 text-primary shadow-neon-sm",
                    "hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <span className="font-medium">{currency.name} ({currency.symbol})</span>
                  <span className="ml-auto text-xs text-muted-foreground">{currency.code}</span>
                  {selectedCurrency.code === currency.code && <CheckCircle className="ml-2 h-4 w-4 text-primary" />}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t border-border/20 pt-4">
          <Button 
            onClick={handleSaveCurrency} 
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-neon"
            disabled={selectedCurrency.code === state.currency.code}
          >
            Save Currency
          </Button>
        </CardFooter>
      </Card>
      
      {/* About Section */}
      <Card className="shadow-neon-sm border-primary/20 bg-card/80 backdrop-blur-sm card-glow">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Info className="mr-2 h-6 w-6" /> About Neon Shopping
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Neon Shopping helps you manage your shopping lists and track your expenses with a vibrant cyberpunk aesthetic.</p>
          <p>Version: 0.1.0 (LocalStorage Mode)</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
