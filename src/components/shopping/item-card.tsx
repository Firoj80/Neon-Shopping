
"use client";
import type React from 'react';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Tag, ShoppingCart } from "lucide-react";
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
         "rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col py-2 px-3 w-full border-primary/20 hover:border-primary/50", // Adjusted padding
         item.checked ? "bg-card/60 border-border/10" : "bg-card glow-border-inner" // Added glow to default state
      )}
      style={{ minHeight: 'auto' }}> {/* Removed fixed minHeight */}
        <div className="flex items-center">
           <Checkbox
                id={`item-${item.id}`}
                checked={item.checked}
                onCheckedChange={handleToggleCheck}
                className="mr-3 shrink-0 h-5 w-5 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                aria-label={`Mark ${item.name} as ${item.checked ? 'incomplete' : 'complete'}`}
            />
            {/* Item Details Container */}
           <div className="flex-grow min-w-0">
                <label
                    htmlFor={`item-${item.id}`}
                    className={cn(
                        "text-sm font-medium leading-tight cursor-pointer block", // Adjusted leading
                        item.checked && "line-through text-muted-foreground"
                    )}
                >
                    {item.name}
                </label>
                 {/* Details Row (Qty, Price, Total, Category) */}
                 <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5"> {/* Reduced margin-top, adjusted gaps */}
                    <span>Qty: {item.quantity}</span>
                    <span>Price: {formatCurrency(item.price)}</span>
                    <span className="font-medium">Total: {formatCurrency(item.price * item.quantity)}</span>
                    <Badge variant="secondary" className="py-0 px-1.5 text-[10px] bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30"> {/* Adjusted badge size */}
                        <Tag className="h-2.5 w-2.5 mr-0.5"/>
                        {categoryName}
                    </Badge>
                </div>
            </div>
           {/* Action Buttons */}
           <div className="flex space-x-0 self-center shrink-0 ml-auto pl-1"> {/* Adjusted spacing and padding */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30" // Smaller buttons
                    onClick={() => onEdit(item)}
                    aria-label={`Edit ${item.name}`}
                >
                    <Pencil className="h-3.5 w-3.5" /> {/* Smaller icon */}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-900/30" // Smaller buttons
                    onClick={() => onDelete(item.id)}
                    aria-label={`Delete ${item.name}`}
                >
                    <Trash2 className="h-3.5 w-3.5" /> {/* Smaller icon */}
                </Button>
            </div>
       </div>
    </Card>
  );
};
