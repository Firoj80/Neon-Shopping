// src/app/(app)/premium/page.tsx
"use client"; 

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ShieldCheckIcon as Shield, BarChart2, FileText, Palette, ListPlus, PlusCircle, TrendingUp, Crown, Gem } from 'lucide-react';
import { useAppContext, FREEMIUM_LIST_LIMIT, DEFAULT_CATEGORIES } from '@/context/app-context'; 
import Link from 'next/link'; // Keep Link for navigating to plans if needed


export default function PremiumPage() {
  const { state } = useAppContext(); 
  // No isPremium check needed as all features are enabled in local version

  const premiumFeatures = [
    { text: "Ad-Free Experience", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { text: "Full Dashboard Access with Advanced Stats", icon: <BarChart2 className="h-5 w-5 text-green-500" /> },
    { text: "Complete Purchase History", icon: <FileText className="h-5 w-5 text-green-500" /> },
    { text: "Analyse and Export Financial Records", icon: <TrendingUp className="h-5 w-5 text-green-500" /> },
    { text: "Create Unlimited Shopping Lists", icon: <ListPlus className="h-5 w-5 text-green-500" /> },
    { text: "Create Unlimited Custom Categories", icon: <PlusCircle className="h-5 w-5 text-green-500" /> },
    { text: "Unlock All Cyberpunk Themes", icon: <Palette className="h-5 w-5 text-green-500" /> },
  ];

  const freemiumLimitations = [
    { text: "Contains Ads (Conceptual - No Ads in Local Version)", icon: <XCircle className="h-5 w-5 text-red-500" /> },
    { text: "No Dashboard Access (All Features Enabled in Local Version)", icon: <XCircle className="h-5 w-5 text-red-500" /> },
    { text: "No Purchase History Access (All Features Enabled in Local Version)", icon: <XCircle className="h-5 w-5 text-red-500" /> },
    { text: "No Financial Analytics or Export (All Features Enabled in Local Version)", icon: <XCircle className="h-5 w-5 text-red-500" /> },
    { text: `Limited to ${FREEMIUM_LIST_LIMIT} Shopping Lists (All Features Enabled in Local Version)`, icon: <ListPlus className="h-5 w-5 text-yellow-500" /> },
    { text: `Limited to ${DEFAULT_CATEGORIES.filter(c => c.id !== 'uncategorized' && c.userId === null).length} Pre-Created Categories (All Features Enabled in Local Version)`, icon: <PlusCircle className="h-5 w-5 text-yellow-500" /> },
    { text: "Default Theme Only (All Themes Available in Local Version)", icon: <Palette className="h-5 w-5 text-yellow-500" /> },
  ];


  return (
    <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-4xl mx-auto">
      <header className="text-center space-y-2">
        <Gem className="h-12 w-12 text-secondary mx-auto animate-pulse" />
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Neon Shopping Premium</h1>
        <p className="text-lg text-muted-foreground">
          Supercharge your shopping and budgeting experience with exclusive features.
        </p>
      </header>

      <Card className="bg-card border-border/30 shadow-md glow-border text-center p-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg text-neonText">Current Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <CardDescription className="text-xl font-bold text-green-500">
             All Features Enabled (Local Version)
            </CardDescription>
             <p className="text-xs text-muted-foreground pt-1">
              This version includes all premium benefits by default.
            </p>
        </CardContent>
      </Card>


      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6"> 
          <Card className="bg-card border-primary/40 shadow-neon glow-border">
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                <Shield className="h-6 w-6" /> Premium Benefits (All Enabled)
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
             <CardFooter className="p-4 border-t border-primary/20">
                <Button asChild className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-neon glow-border">
                    <Link href="/premium-plans">View Conceptual Plans</Link>
                </Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="bg-card border-border/30 shadow-md glow-border">
          <CardHeader>
            <CardTitle className="text-xl text-muted-foreground flex items-center gap-2">
              <XCircle className="h-6 w-6" /> Freemium Model (Conceptual)
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              If this app had a freemium model, these would be the limitations.
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
