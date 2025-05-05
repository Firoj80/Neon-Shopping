
"use client";
import type React from 'react';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShoppingListItem } from '@/context/app-context';
import { useAppContext } from '@/context/app-context';
import { Badge } from '@/components/ui/badge'; // Import Badge

interface ItemCardProps {
  item: ShoppingListItem;
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onDelete }) => {
  const { state, dispatch, formatCurrency } = useAppContext();

  const handleToggleCheck = () => {
    dispatch({ type: 'TOGGLE_SHOPPING_ITEM', payload: item.id });
  };

  // Find the category name from the context state using the item's category ID
  const categoryName = state.categories.find(cat => cat.id === item.category)?.name || 'Uncategorized'; // Fallback

  return (
    <Card className={cn(
        "rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row sm:items-center p-3 w-full border-primary/20 hover:border-primary/50",
        item.checked ? "bg-card/60 border-border/10" : "bg-card"
     )}>
        <div className="flex items-start sm:items-center flex-grow min-w-0 mb-2 sm:mb-0">
            <Checkbox
                id={`item-${item.id}`}
                checked={item.checked}
                onCheckedChange={handleToggleCheck}
                className="mr-3 mt-1 sm:mt-0 shrink-0 h-5 w-5 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                aria-label={`Mark ${item.name} as ${item.checked ? 'incomplete' : 'complete'}`}
            />
            <div className="flex-grow min-w-0">
                <label
                    htmlFor={`item-${item.id}`}
                     className={cn(
                        "text-sm font-medium leading-tight cursor-pointer block",
                        item.checked && "line-through text-muted-foreground"
                    )}
                >
                    {item.name}
                </label>
                 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span>Qty: {item.quantity}</span>
                    <span>Price: {formatCurrency(item.price)}</span>
                    <span className="font-medium">Total: {formatCurrency(item.price * item.quantity)}</span>
                     {/* Display Category Name */}
                     <Badge variant="secondary" className="py-0.5 px-1.5 text-xs bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30">
                        <Tag className="h-3 w-3 mr-1"/>
                        {categoryName}
                     </Badge>
                 </div>
            </div>
        </div>

        <div className="flex space-x-1 self-end sm:self-center sm:ml-auto shrink-0 pl-2">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-7 sm:w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                onClick={() => onEdit(item)}
                aria-label={`Edit ${item.name}`}
            >
                <Pencil className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-7 sm:w-7 text-red-500 hover:text-red-400 hover:bg-red-900/30"
                onClick={() => onDelete(item.id)}
                aria-label={`Delete ${item.name}`}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    </Card>
  );
};

    