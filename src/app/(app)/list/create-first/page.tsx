// src/app/(app)/list/create-first/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, PlusCircle } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context'; // For checking list count if needed

export default function CreateFirstListPage() {
    const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
    const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
    const { state: appState, isLoading: appLoading } = useAppContext();
    const router = useRouter();

    const isLoading = authIsLoading || appLoading;

    // Effect to redirect authenticated users with lists away from this page (now primarily handled by AppLayoutContent)
    // This acts as a secondary check if user lands here directly.
    useEffect(() => {
        if (!isLoading && isAuthenticated && user && Array.isArray(appState.lists)) {
            const userLists = appState.lists.filter(list => list.userId === user.id);
            if (userLists.length > 0) {
                console.log("CreateFirstListPage: Authenticated and has lists, redirecting to /list");
                router.replace('/list');
            }
        }
    }, [isLoading, isAuthenticated, user, appState.lists, router]);

    const handleCreateListClick = () => {
        if (isLoading) {
            console.log("Auth/App still loading, please wait...");
            return;
        }
        if (isAuthenticated && user) {
            setIsAddListModalOpen(true);
        } else {
            // This case should ideally be handled by middleware or AppLayout redirecting to /auth
            console.log("CreateFirstListPage: User not authenticated. This page should not be reachable without auth.");
            router.push('/auth?redirect=/list/create-first'); 
        }
    };

    const handleListCreated = () => {
        setIsAddListModalOpen(false);
        // AppContext will update lists, AppLayoutContent's useEffect will handle redirection to /list
        // Or, more directly, redirect here:
        router.replace('/list');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }
    
    // If an authenticated user has lists, they will be redirected by the useEffect.
    // This page is primarily for authenticated users without lists.
    // If not authenticated, AppLayoutContent should redirect to /auth.

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
            
            {isAuthenticated && user && (
                 <AddEditListModal
                     isOpen={isAddListModalOpen}
                     onClose={() => setIsAddListModalOpen(false)}
                     onListSaved={handleListCreated} // Add this prop to handle successful save
                     // listData is null for creating a new list
                 />
            )}
        </div>
    );
}
