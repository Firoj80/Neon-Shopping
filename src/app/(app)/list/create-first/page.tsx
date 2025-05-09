// src/app/(app)/list/create-first/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, PlusCircle, Lock } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { useAuth } from '@/context/auth-context'; // Use AuthContext
import { useRouter } from 'next/navigation';
import { useAppContext, FREEMIUM_LIST_LIMIT } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


export default function CreateFirstListPage() {
    const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
    const { isAuthenticated, isLoading: authLoading, user } = useAuth(); // Get auth state
    const { state: appState, isLoading: appLoading, dispatch } = useAppContext();
    const { toast } = useToast();
    const router = useRouter();

    const isLoading = authLoading || appLoading;

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            console.log("CreateFirstListPage: Not authenticated, redirecting to /auth");
            router.replace('/auth?redirect=/list/create-first');
        }
        // If authenticated and has lists FOR THE CURRENT USER, redirect to main list page
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
        if (isAuthenticated && user) { // Ensure user object exists
            const userListsCount = Array.isArray(appState.lists) ? appState.lists.filter(l => l.userId === user.id).length : 0;
            if (!appState.isPremium && userListsCount >= FREEMIUM_LIST_LIMIT) {
                toast({
                    title: "List Limit Reached",
                    description: (
                        <div className="flex flex-col gap-2">
                           <span>You've reached the freemium limit of {FREEMIUM_LIST_LIMIT} lists.</span>
                           <Button asChild size="sm" className="mt-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                               <Link href="/premium">Upgrade to Premium</Link>
                           </Button>
                        </div>
                    ),
                    variant: "default",
                });
                return;
            }
            setIsAddListModalOpen(true);
        } else {
             console.log("CreateFirstListPage: User not authenticated, redirecting to /auth for list creation.");
            router.push('/auth?redirect=/list/create-first');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If not authenticated and loading is finished, useEffect will handle redirection.
    // Show a brief message or loader to avoid flashing the page content.
    if (!isAuthenticated && !isLoading) {
        return (
             <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        );
    }
    // If authenticated but userLists.length > 0, useEffect will redirect to /list
    // So, this part of the return will only be reached if authenticated and no lists exist.

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
            {/* Modal is only rendered if user is authenticated, to prevent issues if auth state changes while modal is open */}
            {isAuthenticated && user && (
                 <AddEditListModal
                     isOpen={isAddListModalOpen}
                     onClose={() => setIsAddListModalOpen(false)}
                 />
            )}
        </div>
    );
}
