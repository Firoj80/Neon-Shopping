// src/app/(app)/list/create-first/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, PlusCircle } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';
// Removed useAuth
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context'; 

export default function CreateFirstListPage() {
    const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
    // Removed isAuthenticated, authIsLoading, user from useAuth
    const { state: appState, isLoading: appLoading } = useAppContext();
    const router = useRouter();

    const isLoading = appLoading; // Only appLoading matters now

    // Effect to redirect users with lists away from this page (now primarily handled by AppLayoutContent)
    useEffect(() => {
        if (!isLoading && Array.isArray(appState.lists)) {
            if (appState.lists.length > 0) {
                console.log("CreateFirstListPage: Has lists, redirecting to /list");
                router.replace('/list');
            }
        }
    }, [isLoading, appState.lists, router]);

    const handleCreateListClick = () => {
        if (isLoading) {
            console.log("App still loading, please wait...");
            return;
        }
        // No authentication check needed
        setIsAddListModalOpen(true);
    };

    const handleListCreated = () => {
        setIsAddListModalOpen(false);
        router.replace('/list');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center py-10">
            <ListPlus className="h-16 w-16 text-primary/50 mb-4" />
            <h1 className="text-xl font-semibold text-neonText mb-2">Create Your First List</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
                Welcome to Neon Shopping! Get started by creating your first shopping list to organize your items and track your budget.
            </p>
            <Button
                onClick={handleCreateListClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon glow-border"
                size="lg"
            >
                <PlusCircle className="mr-2 h-5 w-5" /> Create New List
            </Button>
            
            {/* userId will be passed from AppContext if AddEditListModal needs it */}
             <AddEditListModal
                 isOpen={isAddListModalOpen}
                 onClose={() => setIsAddListModalOpen(false)}
                 onListSaved={handleListCreated}
             />
        </div>
    );
}
