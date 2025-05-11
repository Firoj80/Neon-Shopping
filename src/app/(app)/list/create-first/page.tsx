"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, PlusCircle } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { useClientOnly } from '@/hooks/use-client-only';

export default function CreateFirstListPage() {
    const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
    const { state: appState, isLoading: appLoading } = useAppContext();
    const router = useRouter();
    const isClientMounted = useClientOnly();

    const isLoading = appLoading || !isClientMounted;

    useEffect(() => {
        // Check if the anonymous user (identified by appState.userId) has lists
        if (!isLoading && appState.userId) {
            const userLists = appState.lists.filter(list => list.userId === appState.userId);
            if (userLists.length > 0) {
                console.log("CreateFirstListPage: User has lists, redirecting to /list");
                router.replace('/list');
            }
        }
    }, [isLoading, appState.lists, appState.userId, router]);

    const handleCreateListClick = () => {
        setIsAddListModalOpen(true);
    };

    const handleListCreated = () => {
        setIsAddListModalOpen(false);
        router.replace('/list'); // Navigate to the main list page after creation
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }
    
    // If user has lists, useEffect will redirect. This content is for users without lists.
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
            
            <AddEditListModal
                 isOpen={isAddListModalOpen}
                 onClose={() => setIsAddListModalOpen(false)}
                 onListSaved={handleListCreated}
                 // listData is undefined for new lists
             />
        </div>
    );
}
