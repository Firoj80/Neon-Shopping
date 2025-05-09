"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, PlusCircle } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';


export default function CreateFirstListPage() {
    const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { state: appState, isLoading: appLoading } = useAppContext();
    const router = useRouter();

    const isLoading = authLoading || appLoading;

    useEffect(() => {
        // If user is not authenticated and not loading, redirect to auth page
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth');
        }
        // If user is authenticated, has lists, and is on this page, redirect to main list page
        if (!isLoading && isAuthenticated && appState.lists && appState.lists.length > 0) {
            router.replace('/list');
        }
    }, [isLoading, isAuthenticated, appState.lists, router]);


    const handleCreateListClick = () => {
        if (isLoading) {
             console.log("Auth/App still loading, please wait...");
             return;
         }
        if (isAuthenticated) {
            setIsAddListModalOpen(true);
        } else {
            // This case should ideally be caught by the useEffect redirect,
            // but as a fallback:
            router.push('/auth');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If not authenticated (and not loading), this page shouldn't really be reachable due to useEffect redirect.
    // However, as a safeguard, we can return null or a message.
    if (!isAuthenticated) {
        return (
             <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <p className="text-muted-foreground">Redirecting to login...</p>
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
            {isAuthenticated && (
                 <AddEditListModal
                     isOpen={isAddListModalOpen}
                     onClose={() => setIsAddListModalOpen(false)}
                 />
            )}
        </div>
    );
}
