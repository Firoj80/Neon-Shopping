
"use client"; // Add this directive

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Shield, BarChart2, FileText, Palette, ListPlus, PlusCircle, TrendingUp, Crown } from 'lucide-react';
import { useAppContext, FREEMIUM_LIST_LIMIT, DEFAULT_CATEGORIES } from '@/context/app-context'; // Import AppContext and constants
import { useToast } from '@/hooks/use-toast'; // Import useToast


export default function PremiumPage() {
  const { state, dispatch } = useAppContext(); // Get state and dispatch from AppContext
  const { toast } = useToast(); // For showing notifications

  const premiumFeatures = [
    { text: "Ad-Free Experience", icon: <XCircle className="h-5 w-5 text-red-500" /> },
    { text: "Full Dashboard Access with Advanced Stats", icon: <BarChart2 className="h-5 w-5 text-primary" /> },
    { text: "Complete Purchase History", icon: <FileText className="h-5 w-5 text-primary" /> },
    { text: "Analyse and Export Financial Records", icon: <TrendingUp className="h-5 w-5 text-primary" /> },
    { text: "Create Unlimited Shopping Lists", icon: <ListPlus className="h-5 w-5 text-primary" /> },
    { text: "Create Unlimited Custom Categories", icon: <PlusCircle className="h-5 w-5 text-primary" /> },
    { text: "Unlock All Cyberpunk Themes", icon: <Palette className="h-5 w-5 text-primary" /> },
  ];

  const freemiumLimitations = [
    { text: "Contains Ads", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { text: "No Dashboard Access", icon: <XCircle className="h-5 w-5 text-red-500" /> },
    { text: "No Purchase History Access", icon: <XCircle className="h-5 w-5 text-red-500" /> },
    { text: "No Financial Analytics or Export", icon: <XCircle className="h-5 w-5 text-red-500" /> },
    { text: `Limited to ${FREEMIUM_LIST_LIMIT} Shopping Lists`, icon: <ListPlus className="h-5 w-5 text-yellow-500" /> },
    { text: `Limited to ${DEFAULT_CATEGORIES.filter(c => c.id !== 'uncategorized').length} Pre-Created Categories (cannot add or delete defaults)`, icon: <PlusCircle className="h-5 w-5 text-yellow-500" /> },
    { text: "Default Theme Only", icon: <Palette className="h-5 w-5 text-yellow-500" /> },
  ];

  const handleUpgrade = () => {
    dispatch({ type: 'SET_PREMIUM_STATUS', payload: true });
    toast({
      title: "Switched to Premium!",
      description: "Premium features are now enabled (demo).",
    });
  };

  const handleDowngrade = () => {
    dispatch({ type: 'SET_PREMIUM_STATUS', payload: false });
    toast({
      title: "Switched to Freemium",
      description: "Premium features are now disabled (demo).",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-4xl mx-auto">
      <header className="text-center space-y-2">
        <Crown className="h-12 w-12 text-secondary mx-auto animate-pulse" />
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Unlock Neon Premium</h1>
        <p className="text-lg text-muted-foreground">
          Supercharge your shopping and budgeting experience with exclusive features.
        </p>
      </header>

      <Card className="bg-card border-border/30 shadow-md glow-border text-center p-4">
        <CardTitle className="text-lg text-neonText">Current Status</CardTitle>
        <CardDescription className={`text-xl font-bold ${state.isPremium ? 'text-green-500' : 'text-yellow-500'}`}>
          {state.isPremium ? 'Premium Active' : 'Freemium'}
        </CardDescription>
      </Card>


      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6"> {/* Wrapper for Premium Card and Button */}
          <Card className="bg-card border-primary/40 shadow-neon glow-border">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <Shield className="h-6 w-6" /> Premium Benefits
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Everything you need for ultimate financial control.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 glow-border-inner p-4">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/10 glow-border-inner">
                  {React.cloneElement(feature.icon, { className: `${feature.icon.props.className} shrink-0` })}
                  <span className="text-neonText text-sm">{feature.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="text-center space-y-3"> {/* Moved button container here */}
            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-neon-lg hover:shadow-xl hover:shadow-secondary/60 transition-all duration-300 ease-in-out glow-border text-base px-8 py-3 w-full sm:w-auto"
              onClick={handleUpgrade}
              disabled={state.isPremium}
            >
              <Crown className="mr-2 h-5 w-5" /> Upgrade to Premium Now
            </Button>
             {state.isPremium && (
                <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive/80 glow-border-inner w-full sm:w-auto"
                    onClick={handleDowngrade}
                >
                   Downgrade to Freemium (Test)
                </Button>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Secure payment processing. Cancel anytime. (Demo)
            </p>
          </div>
        </div>

        <Card className="bg-card border-border/30 shadow-md glow-border">
          <CardHeader>
            <CardTitle className="text-xl text-muted-foreground flex items-center gap-2">
              <XCircle className="h-6 w-6" /> Freemium Limitations
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Basic features to get you started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 glow-border-inner p-4">
            {freemiumLimitations.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/10 glow-border-inner">
                 {React.cloneElement(feature.icon, { className: `${feature.icon.props.className} shrink-0` })}
                <span className="text-neonText/80 text-sm">{feature.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
