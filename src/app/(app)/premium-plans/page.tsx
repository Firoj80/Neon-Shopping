"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Gem, Star, Zap, ShieldCheck, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  priceMonthly: string;
  priceYearly?: string; // Optional for annual discount display
  priceThreeMonths?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    priceMonthly: '$5.99',
    description: 'Per Month',
    features: [
      'No Ads',
      'Full Dashboard Access',
      'Complete Purchase History',
      'Export Financial Records',
      'Unlimited Shopping Lists',
      'Unlimited Custom Categories',
      'Access All Cyberpunk Themes',
    ],
    cta: 'Subscribe Monthly',
  },
  {
    id: 'three_months',
    name: '3 Months',
    priceThreeMonths: '$15.00',
    description: 'Billed every 3 months (Save ~16%)',
    features: [
      'No Ads',
      'Full Dashboard Access',
      'Complete Purchase History',
      'Export Financial Records',
      'Unlimited Shopping Lists',
      'Unlimited Custom Categories',
      'Access All Cyberpunk Themes',
    ],
    cta: 'Subscribe for 3 Months',
    highlight: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    priceYearly: '$36.00',
    description: 'Billed Annually (Save ~50%)',
    features: [
      'No Ads',
      'Full Dashboard Access',
      'Complete Purchase History',
      'Export Financial Records',
      'Unlimited Shopping Lists',
      'Unlimited Custom Categories',
      'Access All Cyberpunk Themes',
    ],
    cta: 'Subscribe Yearly',
  },
];

export default function PremiumPlansPage() {
  const router = useRouter();

  const handleSubscribe = (planId: string) => {
    // Placeholder for Razorpay integration
    // In a real app, you'd initiate the Razorpay payment flow here.
    // This would involve:
    // 1. Calling your backend to create a Razorpay order.
    // 2. Receiving the order_id from your backend.
    // 3. Initializing Razorpay Checkout with the order_id and your Razorpay Key ID.
    // 4. Handling the payment success/failure callback from Razorpay.
    // 5. Updating the user's subscription status on your backend and in the app context.
    alert(`Subscribing to ${planId} plan. Razorpay integration needed.`);
    // For demo purposes, you might redirect to a success page or back to the premium page.
    // router.push('/premium'); // Or some other page
  };

  return (
    <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-5xl mx-auto">
      <header className="text-center space-y-2">
        <Crown className="h-12 w-12 text-secondary mx-auto animate-pulse" />
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Go Premium with Neon Shopping</h1>
        <p className="text-lg text-muted-foreground">
          Unlock exclusive features and supercharge your financial management.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`bg-card border-border/30 shadow-md glow-border hover:shadow-neon-lg transition-shadow duration-300 flex flex-col ${plan.highlight ? 'border-primary/50 ring-2 ring-primary' : ''}`}
          >
            <CardHeader className="glow-border-inner">
              <CardTitle className={`text-xl font-bold ${plan.highlight ? 'text-primary' : 'text-secondary'}`}>{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {plan.id === 'monthly' && <span className="text-2xl font-extrabold text-neonText">{plan.priceMonthly}</span>}
                {plan.id === 'three_months' && <span className="text-2xl font-extrabold text-neonText">{plan.priceThreeMonths}</span>}
                {plan.id === 'yearly' && <span className="text-2xl font-extrabold text-neonText">{plan.priceYearly}</span>}
                <span className="text-sm text-muted-foreground ml-1">/ {plan.description}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow glow-border-inner">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-neonText text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto glow-border-inner p-4">
              <Button
                size="lg"
                className={`w-full text-base px-8 py-3 shadow-neon-lg hover:shadow-xl transition-all duration-300 ease-in-out glow-border ${
                  plan.highlight
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/60'
                    : 'bg-secondary hover:bg-secondary/90 text-secondary-foreground hover:shadow-secondary/60'
                }`}
                onClick={() => handleSubscribe(plan.id)}
              >
                <Gem className="mr-2 h-5 w-5" /> {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8 p-4 bg-card/50 border border-border/20 rounded-lg glow-border-inner">
        <h3 className="text-lg font-semibold text-secondary mb-2">Razorpay Integration Note:</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          This page demonstrates the UI for subscription plans. Actual payment processing via Razorpay
          requires backend integration to securely create orders and verify payments.
          You would typically use the Razorpay SDK on the client-side to open the checkout.
        </p>
      </div>
    </div>
  );
}
