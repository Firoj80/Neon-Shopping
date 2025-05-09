"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, PlusCircle } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';
import { useAuth } from '@/context/auth-context'; // Import useAuth hook
import { useRouter } from 'next/navigation'; // Import useRouter

// This component specifically handles the "Create First List" scenario
export default function CreateFirstListPage() {
    const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
    const { isAuthenticated, isLoading } = useAuth(); // Get auth state AND loading state
    const router = useRouter();

    const handleCreateListClick = () => {
         // Check loading state first
         if (isLoading) {
             // Optionally show a temporary disabled state or message
             console.log("Auth still loading, please wait...");
             return;
         }

        if (isAuthenticated) {
            setIsAddListModalOpen(true); // Open modal if logged in
        } else {
            router.push('/auth'); // Redirect to login/signup if not logged in
        }
    };

    // Optional: Show a loader while auth is loading
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
                disabled={isLoading} // Disable button while auth is loading
            >
                <PlusCircle className="mr-2 h-5 w-5" /> Create New List
            </Button>
            {/* Conditionally render modal only if authenticated user might open it */}
            {/* Ensure modal only renders if user is confirmed authenticated */}
            {isAuthenticated && !isLoading && (
                 <AddEditListModal
                     isOpen={isAddListModalOpen}
                     onClose={() => setIsAddListModalOpen(false)}
                 />
            )}
        </div>
    );
}
