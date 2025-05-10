// src/app/(app)/list/create-first/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { Button } from '@/components/ui/button';
import { ShoppingCart, PlusCircle } from 'lucide-react';
import { useClientOnly } from '@/hooks/use-client-only';

export default function CreateFirstListPage() {
  const { state, isLoading } = useAppContext(); // Removed dispatch and isInitialDataLoaded, now use state.isInitialDataLoaded
  const router = useRouter();
  const [showAddListModal, setShowAddListModal] = useState(false);
  const isClient = useClientOnly();

  useEffect(() => {
    if (isClient && !isLoading && state.isInitialDataLoaded && state.lists && state.lists.length > 0) {
      console.log("CreateFirstListPage: Lists exist, AppLayout should redirect to /list");
      // AppLayout will handle the redirect to /list, no explicit router.replace here
      // to prevent potential conflicts if AppLayout's redirect is slightly delayed.
    }
  }, [state.lists, isLoading, state.isInitialDataLoaded, router, isClient]);

  const handleOpenAddListModal = () => {
    if (!state.userId) {
        console.error("Cannot create list: User ID is not available.");
        // Potentially show a toast or error message to the user
        return;
    }
    setShowAddListModal(true);
  };

  if (!isClient || isLoading || !state.isInitialDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-center">
        <ShoppingCart className="w-24 h-24 text-primary mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold text-primary mb-4">Loading Your Space...</h1>
        <p className="text-muted-foreground">Getting things ready for you.</p>
      </div>
    );
  }
  
  // If lists exist after loading, AppLayout should handle the primary redirect.
  // This is a fallback visual state while that redirect might be processing.
  if (state.lists && state.lists.length > 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-center">
            <ShoppingCart className="w-24 h-24 text-primary mb-6 animate-pulse" />
            <h1 className="text-3xl font-bold text-primary mb-4">Loading Your Lists...</h1>
            <p className="text-muted-foreground">Redirecting shortly...</p>
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
          disabled={!state.userId} // Disable if userId not yet available
        >
          <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          Create First List
        </Button>
      </div>

      {showAddListModal && state.userId && (
        <AddEditListModal
          isOpen={showAddListModal}
          onClose={() => setShowAddListModal(false)}
          userId={state.userId} // Pass anonymous user ID
          onListCreated={() => {
            // AppLayout will handle redirect to /list
            console.log("CreateFirstListPage: List created, modal closed. AppLayout handles redirect.");
          }}
        />
      )}
       {!state.userId && !isLoading && isClient && ( // Show if userId is missing after loading
         <p className="mt-4 text-sm text-destructive">Error: User session not properly initialized. Please refresh.</p>
       )}
    </div>
  );
}
