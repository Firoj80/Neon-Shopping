
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Gem, Star, Zap, ShieldCheck, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Script from 'next/script'; // Import Script component for Razorpay SDK
import { useAppContext } from '@/context/app-context'; // For currency

interface Plan {
  id: string;
  name: string;
  priceMonthly?: string; // Made optional as yearly/3-months will have their own
  priceYearly?: string;
  priceThreeMonths?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  amountInPaisa: number; // Amount in smallest currency unit (e.g., paisa for INR, cents for USD)
  currency: string; // ISO currency code
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
    amountInPaisa: 599, // 5.99 USD in cents
    currency: 'USD',
  },
  {
    id: 'three_months',
    name: '3 Months',
    priceThreeMonths: '$15.00', // $5 per month
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
    amountInPaisa: 1500, // 15.00 USD in cents
    currency: 'USD',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    priceYearly: '$48.00', // Updated price: $4 per month
    description: 'Billed Annually (Save ~33%)', // Updated saving based on $5.99 monthly
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
    amountInPaisa: 4800, // 48.00 USD in cents
    currency: 'USD',
  },
];

// Define Razorpay type for window object
declare global {
  interface Window {
    Razorpay: any; // Consider using a more specific type if available
  }
}

export default function PremiumPlansPage() {
  const router = useRouter();
  const { state } = useAppContext(); // Get app state for currency, user details

  const handleSubscribe = async (plan: Plan) => {
    // Placeholder for Razorpay Key ID - Replace with your actual Key ID
    const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID';

    if (RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_KEY_ID') {
      alert("Razorpay Key ID not configured. Please set it in your environment variables or directly in the code for testing.");
      return;
    }

    // In a real app, you'd call your backend to create a Razorpay order.
    // Your backend would return an `order_id`.
    // For this frontend-only example, we'll simulate order creation or skip it.
    // However, Razorpay strongly recommends creating orders via backend for security.

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: plan.amountInPaisa, // Amount in the smallest currency unit (e.g., paisa, cents)
      currency: plan.currency, // Or use state.currency.code if plans are dynamic to user's currency
      name: 'Neon Shopping Premium',
      description: `Subscription: ${plan.name}`,
      // image: 'YOUR_LOGO_URL', // Optional: Add your app logo
      // order_id: 'ORDER_ID_FROM_YOUR_BACKEND', // This should come from your server in a real app
      handler: function (response: any) {
        // This function is called when the payment is successful
        console.log('Razorpay Response:', response);
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
        // Here you would typically:
        // 1. Verify the payment signature on your backend.
        // 2. Update the user's subscription status in your database.
        // 3. Update the app context (e.g., dispatch({ type: 'SET_PREMIUM_STATUS', payload: true });)
        // 4. Redirect the user to a success page or back to the premium page.
        router.push('/premium?status=success');
      },
      prefill: {
        // Prefill user details if available from your app's state/auth
        name: state.userId || 'Valued User', // Example: use user's name from auth
        email: 'user@example.com', // Example: use user's email
        contact: '9999999999',    // Example: use user's contact
      },
      notes: {
        address: 'Neon Shopping Corporate Office',
        plan_id: plan.id,
      },
      theme: {
        color: '#00FFFF', // Neon Cyan - primary color of your app
      },
      modal: {
        ondismiss: function () {
          console.log('Razorpay checkout form closed.');
          // Handle modal dismissal (e.g., user closed the payment form)
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Razorpay Payment Failed:', response);
        alert(`Payment failed. Error code: ${response.error.code}. Description: ${response.error.description}`);
        // Handle payment failure (e.g., show an error message, log the error)
        router.push('/premium?status=failed');
      });
      rzp.open();
    } catch (error) {
      console.error("Error initializing Razorpay:", error);
      alert("Error initializing payment gateway. Please try again later.");
    }
  };

  return (
    <>
      {/* Razorpay SDK Script - Loads asynchronously */}
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload" // Load when browser is idle
        onLoad={() => {
          console.log("Razorpay SDK loaded.");
        }}
        onError={(e) => {
          console.error("Failed to load Razorpay SDK", e);
        }}
      />

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
                  {plan.priceMonthly && <span className="text-2xl font-extrabold text-neonText">{plan.priceMonthly}</span>}
                  {plan.priceThreeMonths && <span className="text-2xl font-extrabold text-neonText">{plan.priceThreeMonths}</span>}
                  {plan.priceYearly && <span className="text-2xl font-extrabold text-neonText">{plan.priceYearly}</span>}
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
                  onClick={() => handleSubscribe(plan)}
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
            Ensure your Razorpay Key ID is correctly configured (e.g., via environment variables).
          </p>
        </div>
      </div>
    </>
  );
}
