// src/app/(app)/premium-plans/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, Zap, Loader2, InfoIcon } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';

interface PlanFeature {
  text: string;
  icon?: React.ReactNode;
}

interface Plan {
  id: string;
  name: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  description: string;
  features: string[];
}

const premiumFeaturesList: PlanFeature[] = [
    { text: "Ad-Free Experience", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { text: "Full Dashboard Access with Advanced Stats", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { text: "Complete Purchase History", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { text: "Analyse and Export Financial Records", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { text: "Create Unlimited Shopping Lists", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { text: "Create Unlimited Custom Categories", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { text: "Unlock All Cyberpunk Themes", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
];

const staticPlans: Plan[] = [
  {
    id: 'monthly_basic',
    name: 'Monthly Basic',
    priceMonthly: 5.99,
    priceYearly: null,
    description: 'Access all premium features, billed monthly.',
    features: [
      "Ad-Free Experience",
      "Full Dashboard Access",
      "Complete Purchase History",
    ],
  },
  {
    id: 'three_month_standard',
    name: '3-Month Standard',
    priceMonthly: 15.00, 
    priceYearly: null,
    description: 'Enjoy 3 months of premium access.',
    features: [
      "Ad-Free Experience",
      "Full Dashboard Access",
      "Complete Purchase History",
      "Export Financial Records",
      "Create Unlimited Shopping Lists",
    ],
  },
  {
    id: 'yearly_premium',
    name: 'Yearly Premium',
    priceMonthly: null,
    priceYearly: 48.00, 
    description: 'Best value! Full year of premium access.',
    features: [
      "Ad-Free Experience",
      "Full Dashboard Access",
      "Complete Purchase History",
      "Analyse and Export Financial Records",
      "Create Unlimited Shopping Lists",
      "Create Unlimited Custom Categories",
      "Unlock All Cyberpunk Themes",
    ],
  },
];


export default function PremiumPlansPage() {
  const { state: appState, formatCurrency } = useAppContext();
  const [plans, setPlans] = useState<Plan[]>(staticPlans); 
  const [isLoadingPlans, setIsLoadingPlans] = useState(false); 


  if (isLoadingPlans) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-neonText">Loading plans...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-5xl mx-auto">
        <header className="text-center space-y-2">
          <Crown className="h-12 w-12 text-secondary mx-auto animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Premium Plans (Conceptual)</h1>
          <p className="text-lg text-muted-foreground">
            This page outlines conceptual premium plans. Payment integration is not active in this local version.
          </p>
        </header>

        {plans.length === 0 && !isLoadingPlans && (
            <Card className="bg-card border-border/30 shadow-md glow-border text-center p-6">
                <InfoIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
                <CardTitle className="text-xl text-neonText">No Plans Available</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                    Premium plans are currently unavailable. Please check back later.
                </CardDescription>
            </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "bg-card border-border/30 shadow-md hover:shadow-neon-lg transition-all transform hover:scale-105 flex flex-col glow-border",
              )}
            >
              <CardHeader className="pb-4 glow-border-inner">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-secondary">{plan.name}</CardTitle>
                  {(plan.id === 'yearly_premium' || plan.id === 'three_month_standard') && (
                     <div className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold glow-border-inner">
                        {plan.id === 'yearly_premium' ? 'Best Value' : 'Popular'}
                     </div>
                  )}
                </div>
                <CardDescription className="text-muted-foreground pt-1">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 glow-border-inner">
                <div className="text-4xl font-bold text-neonText">
                  {plan.priceYearly ? formatCurrency(plan.priceYearly) : plan.priceMonthly ? formatCurrency(plan.priceMonthly) : 'Free'}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.priceYearly ? 'year' : 'month'}</span>
                </div>
                <ul className="space-y-2 text-sm text-neonText/90">
                  {plan.features.map((featureText, index) => {
                    const featureDetail = premiumFeaturesList.find(f => f.text.toLowerCase().includes(featureText.toLowerCase().replace(/_/g, " ")));
                    return (
                      <li key={index} className="flex items-center gap-2">
                        {featureDetail?.icon || <CheckCircle className="h-5 w-5 text-green-500" />}
                        <span>{featureDetail?.text || featureText.replace(/_/g, " ")}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto glow-border-inner p-4">
                <Button
                  className="w-full bg-primary hover:bg-primary/80 text-primary-foreground shadow-neon glow-border text-base"
                  disabled 
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Subscribe (Feature Not Active)
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
         <div className="text-center text-xs text-muted-foreground mt-8">
           Payment integration and actual subscriptions are not implemented in this local version.
        </div>
      </div>
    </>
  );
}
