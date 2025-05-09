// src/app/auth/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, LogIn, UserPlus, ShoppingCart } from 'lucide-react';
import { useAppContext } from '@/context/app-context';

// --- Validation Schemas ---
const signUpSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { login, signup, isLoading: authIsLoading, isAuthenticated } = useAuth();
  const { dispatch: appDispatch, state: appState } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
    reset: resetSignUp,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      const redirectedFrom = searchParams.get('redirectedFrom');
      if (redirectedFrom) {
        router.replace(redirectedFrom);
      } else if (appState.lists && appState.lists.length > 0) {
        router.replace('/list');
      } else {
        router.replace('/list/create-first');
      }
    }
  }, [authIsLoading, isAuthenticated, router, appState.lists, searchParams]);

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const success = await login(data.email, data.password);
    // Redirection handled by useEffect
    setIsSubmitting(false);
    if (success) resetLogin(); // Only reset if successful
  };

  const onSignUpSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    const success = await signup(data.name, data.email, data.password);
    // Redirection handled by useEffect
    setIsSubmitting(false);
    if (success) resetSignUp(); // Only reset if successful
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetLogin();
    resetSignUp();
    setIsSubmitting(false);
  };

  if (authIsLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
  }

  // If already authenticated and not loading, useEffect will redirect.
  // Show minimal content or loader to prevent brief flash of auth form.
  if (isAuthenticated && !authIsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
         <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/30 shadow-neon-lg glow-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <ShoppingCart className="h-7 w-7"/> Neon Shopping
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {activeTab === 'login' ? 'Login to access your lists' : 'Create an account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/20 shadow-sm glow-border-inner">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-neon/30 transition-all">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:shadow-neon/30 transition-all">
                 <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="login-email" className="text-neonText/80 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    {...registerLogin('email')}
                    placeholder="you@example.com"
                    className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner"
                    aria-invalid={loginErrors.email ? "true" : "false"}
                  />
                  {loginErrors.email && <p className="text-red-500 text-xs pt-1">{loginErrors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-password" className="text-neonText/80 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    {...registerLogin('password')}
                    placeholder="••••••••"
                    className="border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary glow-border-inner"
                    aria-invalid={loginErrors.password ? "true" : "false"}
                  />
                  {loginErrors.password && <p className="text-red-500 text-xs pt-1">{loginErrors.password.message}</p>}
                </div>
                 <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow glow-border-inner" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSubmitSignUp(onSignUpSubmit)} className="space-y-4">
                 <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-neonText/80 flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    {...registerSignUp('name')}
                    placeholder="Your Name"
                     className="border-secondary/50 focus:border-secondary focus:shadow-neon focus:ring-secondary glow-border-inner"
                    aria-invalid={signUpErrors.name ? "true" : "false"}
                  />
                  {signUpErrors.name && <p className="text-red-500 text-xs pt-1">{signUpErrors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-neonText/80 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    {...registerSignUp('email')}
                    placeholder="you@example.com"
                     className="border-secondary/50 focus:border-secondary focus:shadow-neon focus:ring-secondary glow-border-inner"
                    aria-invalid={signUpErrors.email ? "true" : "false"}
                  />
                  {signUpErrors.email && <p className="text-red-500 text-xs pt-1">{signUpErrors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-neonText/80 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    {...registerSignUp('password')}
                    placeholder="Choose a strong password"
                     className="border-secondary/50 focus:border-secondary focus:shadow-neon focus:ring-secondary glow-border-inner"
                    aria-invalid={signUpErrors.password ? "true" : "false"}
                  />
                  {signUpErrors.password && <p className="text-red-500 text-xs pt-1">{signUpErrors.password.message}</p>}
                </div>
                 <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-neon hover:shadow-lg hover:shadow-secondary/50 transition-shadow glow-border-inner" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                 </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
