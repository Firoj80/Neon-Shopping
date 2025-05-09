// src/app/(app)/premium-plans/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, Zap, Loader2, InfoIcon } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { fetchFromApi } from '@/lib/api'; // Your API helper
import Script from 'next/script'; // For loading Razorpay SDK

interface PlanFeature {
  text: string;
  icon?: React.ReactNode; // Optional icon for features
}

interface Plan {
  id: string;
  name: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  description: string;
  features: string[]; // Keep as string array from backend
  razorpayPlanId?: string; // Optional: if you create plans on Razorpay dashboard
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

// Placeholder for your actual Razorpay Key ID (use environment variables in production)
const RAZORPAY_KEY_ID_PLACEHOLDER = 'YOUR_RAZORPAY_TEST_KEY_ID'; // Replace with your actual TEST Key ID

export default function PremiumPlansPage() {
  const { state: appState, dispatch: appDispatch, formatCurrency } = useAppContext();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null); // Store planId being processed
  const [isRazorpaySdkLoaded, setIsRazorpaySdkLoaded] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const data = await fetchFromApi('premium/get_plans.php', { method: 'GET' });
        if (data.success && Array.isArray(data.plans)) {
          setPlans(data.plans);
        } else {
          toast({ title: "Error", description: data.message || "Could not load premium plans.", variant: "destructive" });
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to fetch plans.", variant: "destructive" });
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [toast]);

  const handleSubscribe = async (plan: Plan) => {
    if (!isAuthenticated || !user) {
      toast({ title: "Authentication Required", description: "Please log in to subscribe.", variant: "default" });
      // Optionally redirect to login: router.push('/auth?redirect=/premium-plans');
      return;
    }
    if (!isRazorpaySdkLoaded) {
        toast({ title: "Payment Gateway Loading", description: "Please wait for Razorpay to load.", variant: "default" });
        return;
    }

    setIsProcessingPayment(plan.id);

    const amount = plan.priceYearly ?? plan.priceMonthly ?? 0;
    const currency = appState.currency.code; // Assuming currency is set in app context

    try {
        // Step 1: Create an order from your backend
        const orderResponse = await fetchFromApi('payments/create_order.php', {
            method: 'POST',
            body: JSON.stringify({ 
                amount: amount, 
                currency: currency,
                plan_id: plan.id // Send plan_id for logging/verification
            }),
        });

        if (!orderResponse.success || !orderResponse.order_id) {
            toast({ title: "Payment Error", description: orderResponse.message || "Could not create payment order.", variant: "destructive" });
            setIsProcessingPayment(null);
            return;
        }

        const razorpayOptions = {
            key: orderResponse.key_id || RAZORPAY_KEY_ID_PLACEHOLDER, // Use key from backend or placeholder
            amount: orderResponse.amount, // Amount in paise from backend
            currency: orderResponse.currency,
            name: "Neon Shopping Premium",
            description: `Subscription to ${plan.name}`,
            order_id: orderResponse.order_id,
            handler: async function (response: any) {
                // Step 2: Verify payment on your backend
                try {
                    const verificationResponse = await fetchFromApi('payments/verify_payment.php', {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            user_id: user.id,
                            plan_id: plan.id, // Pass plan_id for subscription update logic
                            // Optional: Pass amount and currency for server-side validation if needed
                            // amount_paid_to_verify: orderResponse.amount, 
                            // currency_to_verify: orderResponse.currency 
                        }),
                    });

                    if (verificationResponse.success) {
                        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: true });
                        // Optionally, dispatch to update user details if backend returns them
                        toast({ title: "Subscription Successful!", description: `You are now subscribed to ${plan.name}.`, variant: "default" });
                        // Potentially redirect or update UI further
                    } else {
                        toast({ title: "Payment Verification Failed", description: verificationResponse.message || "Please contact support.", variant: "destructive" });
                    }
                } catch (verifyError: any) {
                    toast({ title: "Payment Verification Error", description: verifyError.message || "An unexpected error occurred.", variant: "destructive" });
                } finally {
                    setIsProcessingPayment(null);
                }
            },
            prefill: {
                name: user.name || "",
                email: user.email || "",
                // contact: "9999999999" // Optional
            },
            theme: {
                color: "#00FFFF" // Your primary neon color
            },
            modal: {
                ondismiss: function() {
                    setIsProcessingPayment(null);
                    toast({ title: "Payment Cancelled", description: "Your payment process was cancelled.", variant: "default"});
                }
            }
        };
        
        // @ts-ignore // Razorpay is loaded via script tag
        const rzp = new window.Razorpay(razorpayOptions);
        rzp.open();

    } catch (error: any) {
        toast({ title: "Subscription Error", description: error.message || "Could not process subscription.", variant: "destructive" });
        setIsProcessingPayment(null);
    }
  };


  if (authLoading || isLoadingPlans) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-neonText">Loading plans...</p>
      </div>
    );
  }

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
            setIsRazorpaySdkLoaded(true);
            console.log("Razorpay SDK loaded.");
        }}
        onError={(e) => {
            console.error("Error loading Razorpay SDK:", e);
            toast({ title: "Payment Gateway Error", description: "Could not load Razorpay SDK. Please try again later.", variant: "destructive"});
        }}
      />
      <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-5xl mx-auto">
        <header className="text-center space-y-2">
          <Crown className="h-12 w-12 text-secondary mx-auto animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Premium Plans</h1>
          <p className="text-lg text-muted-foreground">
            Choose a plan that fits your cyberpunk lifestyle and unlock all features.
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
                appState.isPremium && (plan.id === 'monthly' || plan.id === 'three_month' || plan.id === 'yearly') ? "ring-2 ring-primary" : "" // Example: highlight active plan type
              )}
            >
              <CardHeader className="pb-4 glow-border-inner">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-secondary">{plan.name}</CardTitle>
                  {(plan.id === 'yearly' || plan.id === 'three_month') && (
                     <div className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold glow-border-inner">
                        {plan.id === 'yearly' ? 'Best Value' : 'Popular'}
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
                  {plan.features.map((featureKey, index) => {
                    const featureDetail = premiumFeaturesList.find(f => f.text.toLowerCase().includes(featureKey.toLowerCase().replace(/_/g, " ")));
                    return (
                      <li key={index} className="flex items-center gap-2">
                        {featureDetail?.icon || <CheckCircle className="h-5 w-5 text-green-500" />}
                        <span>{featureDetail?.text || featureKey.replace(/_/g, " ")}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto glow-border-inner p-4">
                <Button
                  onClick={() => handleSubscribe(plan)}
                  className="w-full bg-primary hover:bg-primary/80 text-primary-foreground shadow-neon glow-border text-base"
                  disabled={isProcessingPayment === plan.id || !isRazorpaySdkLoaded}
                >
                  {isProcessingPayment === plan.id ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-5 w-5" />
                  )}
                  {isProcessingPayment === plan.id ? 'Processing...' : 'Subscribe Now'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
         <div className="text-center text-xs text-muted-foreground mt-8">
            Payments are securely processed by Razorpay. Subscription terms and conditions apply.
            <br />
            Your Razorpay Test Key ID: <span className="font-mono text-secondary">{RAZORPAY_KEY_ID_PLACEHOLDER}</span> (Replace this).
        </div>
      </div>
    </>
  );
}
