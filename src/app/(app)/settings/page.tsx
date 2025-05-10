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
import { CheckCircle, Palette, DollarSign, Info, Trash2, Edit2, PlusCircle } from 'lucide-react';
import { themes, defaultThemeId } from '@/config/themes'; // Import themes
import type { Theme } from '@/config/themes';
import { useClientOnly } from '@/hooks/use-client-only';

const SettingsPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(state.currency);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(state.theme || defaultThemeId);
  const isClient = useClientOnly();

  useEffect(() => {
    setSelectedCurrency(state.currency);
    setSelectedThemeId(state.theme || defaultThemeId);
  }, [state.currency, state.theme]);

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

  const handleThemeChange = (themeId: string) => {
    setSelectedThemeId(themeId);
    dispatch({ type: 'SET_THEME', payload: themeId });
    toast({
      title: "Theme Updated",
      description: `Theme changed to ${themes.find(t => t.id === themeId)?.name || 'Selected Theme'}.`,
      className: "bg-primary text-primary-foreground border-primary/50 shadow-neon",
    });
  };
  
  const filteredCurrencies = समर्थितमुद्राएँ.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.includes(searchTerm)
  );

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Settings className="w-16 h-16 animate-pulse text-primary" />
        <p className="ml-4 text-lg font-semibold">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight flex items-center">
          <Settings className="mr-3 h-8 w-8 sm:h-10 sm:h-10" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your application preferences.
        </p>
      </header>

      {/* Currency Settings Card */}
      <Card className="shadow-neon-sm border-primary/20 bg-card/80 backdrop-blur-sm">
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

      {/* Theme Settings Card */}
      <Card className="shadow-neon-sm border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Palette className="mr-2 h-6 w-6" /> Appearance & Themes
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {themes.map((theme) => (
              <Button
                key={theme.id}
                variant={selectedThemeId === theme.id ? 'secondary' : 'outline'}
                onClick={() => handleThemeChange(theme.id)}
                className={cn(
                  "w-full h-20 sm:h-24 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 ease-in-out",
                  selectedThemeId === theme.id ? 'border-primary shadow-neon bg-primary/10' : 'border-border/50 hover:border-primary/70',
                )}
                style={{
                  // @ts-ignore
                  '--preview-bg': theme.colors['--background'],
                  '--preview-fg': theme.colors['--foreground'],
                  '--preview-primary': theme.colors['--primary'],
                  '--preview-card': theme.colors['--card'],
                } as React.CSSProperties}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mb-1.5 sm:mb-2 flex items-center justify-center bg-[var(--preview-primary)]">
                   <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm bg-[var(--preview-card)] shadow-inner"></div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-center text-[var(--preview-fg)] truncate w-full">{theme.name}</span>
                 {selectedThemeId === theme.id && (
                  <CheckCircle className="absolute top-1.5 right-1.5 h-4 w-4 text-primary" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* About Section */}
      <Card className="shadow-neon-sm border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Info className="mr-2 h-6 w-6" /> About Neon Shopping
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Neon Shopping List helps you manage your shopping lists and track your expenses with a vibrant cyberpunk aesthetic.</p>
          <p>Version: 0.1.0 (Rollback a5b0e2a0)</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
