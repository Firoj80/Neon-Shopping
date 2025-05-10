
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { Button } from '@/components/ui/button';
import { ShoppingCart, PlusCircle } from 'lucide-react';
import { useClientOnly } from '@/hooks/use-client-only';

export default function CreateFirstListPage() {
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const router = useRouter();
  const [showAddListModal, setShowAddListModal] = useState(false);
  const isClient = useClientOnly();

  const handleOpenAddListModal = () => {
    if (!appState.userId) { 
        console.error("Cannot create list: User ID is not available in AppContext.");
        return;
    }
    setShowAddListModal(true);
  };

  if (!isClient || appIsLoading || !appState.isInitialDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-center">
        <ShoppingCart className="w-24 h-24 text-primary mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold text-primary mb-4">Loading Your Space...</h1>
        <p className="text-muted-foreground">Getting things ready for you.</p>
      </div>
    );
  }
  
  // Redirect if lists already exist (AppLayout should also handle this)
  if (appState.lists && appState.lists.length > 0) {
    // router.replace('/list'); // This is now handled by AppLayout useEffect primarily
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
      <div className="bg-card p-8 sm:p-12 rounded-xl shadow-neon-lg border border-primary/30 max-w-md w-full card-glow">
        <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 text-primary mx-auto mb-6" />
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">Create Your First List</h1>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          Welcome to Neon Shopping! Get started by creating your first shopping list to organize your items and track your budget.
        </p>
        <Button
          onClick={handleOpenAddListModal}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3 rounded-lg shadow-md hover:shadow-neon transition-all duration-300 ease-in-out transform hover:scale-105 group"
          disabled={!appState.userId} 
        >
          <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          Create First List
        </Button>
      </div>

      {showAddListModal && appState.userId && (
        <AddEditListModal
          isOpen={showAddListModal}
          onClose={() => setShowAddListModal(false)}
          userId={appState.userId} 
          onListCreated={() => {
            // AppLayout will handle redirect to /list after list creation updates AppContext
          }}
        />
      )}
       {!appState.userId && !appIsLoading && isClient && ( 
         <p className="mt-4 text-sm text-destructive">User ID not available. Please try reloading.</p>
       )}
    </div>
  );
}
