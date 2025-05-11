
"use client"; // ListLayout needs to be a client component to use Tabs

import React from 'react';
import { Tabs } from "@/components/ui/tabs"; // Import Tabs components

// This layout wraps the ShoppingListPage to provide the Tabs context higher up
export default function ListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="current" className="flex flex-col h-full"> {/* Tabs wrapper here */}
        {children}
    </Tabs>
  );
}
