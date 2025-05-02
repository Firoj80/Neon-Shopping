"use client";
import type React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShoppingListItem } from '@/context/app-context';
import { useAppContext } from '@/context/app-context';

interface ItemCardProps {
  item: ShoppingListItem;
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onDelete }) => {
  const { dispatch, formatCurrency } = useAppContext();

  const handleToggleCheck = () => {
    dispatch({ type: 'TOGGLE_SHOPPING_ITEM', payload: item.id });
  };

  return (
    <Card className="bg-card rounded-2xl shadow-neon hover:scale-[1.02] transition-transform duration-200 flex flex-col min-h-[120px] border-primary/20 hover:border-primary/50">
      <CardContent className="p-3 flex-grow flex flex-col justify-between">
        <div className="flex items-start space-x-3 mb-2">
          <Checkbox
            id={`item-${item.id}`}
            checked={item.checked}
            onCheckedChange={handleToggleCheck}
            className="mt-1 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
            aria-label={`Mark ${item.name} as ${item.checked ? 'incomplete' : 'complete'}`}
          />
          <label
            htmlFor={`item-${item.id}`}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer",
              item.checked && "line-through text-muted-foreground"
            )}
          >
            {item.name}
          </label>
        </div>
        <div className="text-xs text-muted-foreground space-y-1 pl-7">
            <p>Qty: {item.quantity}</p>
            <p>Price: {formatCurrency(item.price)}</p>
            <p>Total: {formatCurrency(item.price * item.quantity)}</p>
            <p>Category: <span className="font-medium text-secondary">{item.category}</span></p>
        </div>

      </CardContent>
      <CardFooter className="p-2 border-t border-border/20 flex justify-end space-x-1">
         <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
          onClick={() => onEdit(item)}
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-900/30"
          onClick={() => onDelete(item.id)}
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
