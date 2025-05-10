
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { Button } from '@/components/ui/button';
import { ShoppingCart, PlusCircle } from 'lucide-react';
import { useClientOnly } from '@/hooks/use-client-only';
import { useAuth } from '@/context/auth-context'; // Import useAuth

export default function CreateFirstListPage() {
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const { user: authUser, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [showAddListModal, setShowAddListModal] = useState(false);
  const isClient = useClientOnly();

  // Redirection logic is primarily handled by AppLayout and middleware now.
  // This page should only be shown if authenticated and no lists exist.

  const handleOpenAddListModal = () => {
    if (!authUser?.id) { // Check authenticated user's ID
        console.error("Cannot create list: User is not authenticated or User ID is not available.");
        // Optionally, redirect to auth page, though AppLayout should handle this
        // router.push('/auth'); 
        return;
    }
    setShowAddListModal(true);
  };

  if (!isClient || appIsLoading || authIsLoading) {
    // This page itself shouldn't show its own major loader if AppLayout is handling it.
    // However, keeping a minimal loader for direct navigation scenarios.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-center">
        <ShoppingCart className="w-24 h-24 text-primary mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold text-primary mb-4">Loading Your Space...</h1>
        <p className="text-muted-foreground">Getting things ready for you.</p>
      </div>
    );
  }
  
  // This condition should ideally be caught by AppLayout redirecting to /list
  if (appState.lists && appState.lists.length > 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-center">
            <ShoppingCart className="w-24 h-24 text-primary mb-6 animate-pulse" />
            <h1 className="text-3xl font-bold text-primary mb-4">Loading Your Lists...</h1>
            <p className="text-muted-foreground">Redirecting shortly...</p>
        </div>
    );
  }

  // If not authenticated and somehow reached this page (should be redirected by AppLayout/middleware)
  if (!isAuthenticated) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-center">
            <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Please log in to create a shopping list.</p>
            <Button onClick={() => router.push('/auth')} className="mt-6">Go to Login</Button>
        </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-background to-primary/10 text-center">
      <div className="bg-card p-8 sm:p-12 rounded-xl shadow-neon-lg border border-primary/30 max-w-md w-full">
        <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 text-primary mx-auto mb-6" />
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">Create Your First List</h1>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          Welcome to Neon Shopping! Get started by creating your first shopping list to organize your items and track your budget.
        </p>
        <Button
          onClick={handleOpenAddListModal}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3 rounded-lg shadow-md hover:shadow-neon transition-all duration-300 ease-in-out transform hover:scale-105 group"
          disabled={!authUser?.id} // Disable if no authenticated user ID
        >
          <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          Create First List
        </Button>
      </div>

      {showAddListModal && authUser?.id && ( // Ensure authUser.id is present
        <AddEditListModal
          isOpen={showAddListModal}
          onClose={() => setShowAddListModal(false)}
          userId={authUser.id} 
          onListCreated={() => {
            // AppLayout will handle redirect to /list after list creation updates AppContext
          }}
        />
      )}
       {!authUser?.id && !authIsLoading && isClient && ( 
         <p className="mt-4 text-sm text-destructive">User not authenticated. Please log in.</p>
       )}
    </div>
  );
}
