"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, PlusCircle } from 'lucide-react';
import { AddEditListModal } from '@/components/list/AddEditListModal';

// This component specifically handles the "Create First List" scenario
export default function CreateFirstListPage() {
    const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center py-10">
            <ListPlus className="h-16 w-16 text-primary/50 mb-4" />
            <h1 className="text-xl font-semibold text-neonText mb-2">Create Your First List</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
                Welcome to Neon Shopping! Get started by creating your first shopping list to organize your items and track your budget.
            </p>
            <Button
                onClick={() => setIsAddListModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon glow-border"
                size="lg"
            >
                <PlusCircle className="mr-2 h-5 w-5" /> Create New List
            </Button>
            <AddEditListModal
                isOpen={isAddListModalOpen}
                onClose={() => setIsAddListModalOpen(false)}
            />
        </div>
    );
}
