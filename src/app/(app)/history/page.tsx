
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import type { ShoppingListItem } from '@/context/app-context';
import { subDays, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Filter, Layers, CalendarDays, Tag, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { itemCategories } from '@/config/categories';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

type CategoryFilter = string; // 'all' or specific category name
type SortOption = 'dateDesc' | 'dateAsc' | 'priceDesc' | 'priceAsc';

export default function HistoryPage() {
    const { state, dispatch, formatCurrency, isLoading } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [sortOption, setSortOption] = useState<SortOption>('dateDesc');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, 29)); // Default to last 30 days
        return { from: startDate, to: endDate };
    });

    // Filter and sort items based on selections
    const historyItems = useMemo(() => {
        let items = state.shoppingList.filter(item => item.checked); // Only purchased items

        // Date Range Filter
        if (dateRange?.from && dateRange?.to) {
            const startDate = startOfDay(dateRange.from);
            const endDate = endOfDay(dateRange.to);
            items = items.filter(item => {
                const itemDate = new Date(item.dateAdded);
                return isWithinInterval(itemDate, { start: startDate, end: endDate });
            });
        }

        // Category Filter
        if (selectedCategory !== 'all') {
            items = items.filter(item => item.category === selectedCategory);
        }

        // Sorting
        items.sort((a, b) => {
            switch (sortOption) {
                case 'dateAsc': return a.dateAdded - b.dateAdded;
                case 'priceDesc': return (b.price * b.quantity) - (a.price * a.quantity);
                case 'priceAsc': return (a.price * a.quantity) - (b.price * b.quantity);
                case 'dateDesc':
                default: return b.dateAdded - a.dateAdded;
            }
        });

        return items;
    }, [state.shoppingList, dateRange, selectedCategory, sortOption]);

    const handleDateRangeChange = (newRange: DateRange | undefined) => {
        setDateRange(newRange);
    };

     const handleDeleteItem = (id: string) => {
        setItemToDelete(id); // Trigger confirmation dialog
     };

     const confirmDelete = () => {
        if (itemToDelete) {
          // Note: Deleting from history also removes it from the main list if needed.
          // Consider if you want separate history or just filtering the main list.
          // This implementation assumes deletion removes it permanently.
          dispatch({ type: 'REMOVE_SHOPPING_ITEM', payload: itemToDelete });
          setItemToDelete(null); // Close dialog
        }
     };

    if (isLoading) {
        return <HistoryPageSkeleton />;
    }

    const getFilterLabel = () => {
        let dateLabel = 'All Time';
         if (dateRange?.from && dateRange?.to) {
             dateLabel = `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`;
         }
        const categoryLabel = selectedCategory === 'all' ? '' : ` (${selectedCategory})`;
        return `${dateLabel}${categoryLabel}`;
    };

    return (
        <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0 h-full">
            <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
                <History className="h-6 w-6" /> Purchase History
            </h1>

            {/* Filter & Sort Section */}
            <Card className="bg-card/80 border-border/20 shadow-sm sticky top-0 z-10 backdrop-blur-sm"> {/* Sticky filters */}
                <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                    <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filters & Sort
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-2">
                    {/* Date Range Picker */}
                    <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[240px]">
                        <DateRangePicker
                            range={dateRange}
                            onRangeChange={handleDateRangeChange}
                            triggerClassName="w-full justify-start text-left font-normal text-xs sm:text-sm"
                            align="start"
                        />
                    </div>
                    {/* Category Selector */}
                    <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                        <Select value={selectedCategory} onValueChange={(value: CategoryFilter) => setSelectedCategory(value)}>
                            <SelectTrigger className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary text-xs sm:text-sm">
                                <Layers className="h-4 w-4 mr-2 opacity-70" />
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-primary/80 text-neonText max-h-60 overflow-y-auto" position="popper">
                                <ScrollArea className="h-full">
                                    <SelectGroup>
                                        <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Category</SelectLabel>
                                        <SelectItem value="all" className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-xs sm:text-sm">All Categories</SelectItem>
                                        {itemCategories.map((category) => (
                                            <SelectItem key={category} value={category} className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-xs sm:text-sm">
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                    </div>
                     {/* Sort Selector */}
                     <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                        <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                            <SelectTrigger className="w-full border-secondary/50 focus:border-secondary focus:shadow-secondary focus:ring-secondary text-xs sm:text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-secondary/80 text-neonText" position="popper">
                                <SelectGroup>
                                     <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Sort Order</SelectLabel>
                                    <SelectItem value="dateDesc" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary cursor-pointer py-2 text-xs sm:text-sm">Date (Newest First)</SelectItem>
                                    <SelectItem value="dateAsc" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary cursor-pointer py-2 text-xs sm:text-sm">Date (Oldest First)</SelectItem>
                                    <SelectItem value="priceDesc" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary cursor-pointer py-2 text-xs sm:text-sm">Total Price (High-Low)</SelectItem>
                                    <SelectItem value="priceAsc" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary cursor-pointer py-2 text-xs sm:text-sm">Total Price (Low-High)</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* History List */}
            <div className="flex-grow overflow-hidden">
                <ScrollArea className="h-full pr-1">
                    {historyItems.length > 0 ? (
                        <div className="flex flex-col gap-2 pb-4">
                            {historyItems.map((item) => (
                                <HistoryItemCard key={item.id} item={item} formatCurrency={formatCurrency} onDelete={handleDeleteItem} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center py-10">
                            <p className="text-muted-foreground">No purchase history found for the selected filters.</p>
                        </div>
                    )}
                </ScrollArea>
            </div>

             {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Delete Item from History?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the item from your shopping list and history.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

// --- History Item Card ---
interface HistoryItemCardProps {
    item: ShoppingListItem;
    formatCurrency: (amount: number) => string;
    onDelete: (id: string) => void;
}

const HistoryItemCard: React.FC<HistoryItemCardProps> = ({ item, formatCurrency, onDelete }) => {
  const purchaseDate = format(new Date(item.dateAdded), 'MMM d, yyyy');
  const totalItemPrice = item.price * item.quantity;

  return (
    <Card className="rounded-lg shadow-sm p-3 w-full border-secondary/20 bg-card/70 hover:border-secondary/40 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
         {/* Item Details */}
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium leading-tight text-neonText/90">{item.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            <span>Qty: {item.quantity}</span>
            <span>Price: {formatCurrency(item.price)}</span>
            <span className="font-medium text-neonText/80">Total: {formatCurrency(totalItemPrice)}</span>
            <Badge variant="secondary" className="py-0.5 px-1.5 text-xs bg-secondary/20 text-secondary border-secondary/30">
              <Tag className="h-3 w-3 mr-1" />{item.category}
            </Badge>
          </div>
        </div>

        {/* Date & Delete Button */}
         <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 mt-2 sm:mt-0">
             <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {purchaseDate}
            </span>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-900/30"
                onClick={() => onDelete(item.id)}
                aria-label={`Delete ${item.name} from history`}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
         </div>

      </div>
    </Card>
  );
};


// --- Skeleton Loader ---
const HistoryPageSkeleton: React.FC = () => (
    <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0 h-full animate-pulse">
        <Skeleton className="h-7 w-2/5 sm:h-8 sm:w-1/3" /> {/* Title */}

        {/* Filter Skeleton */}
        <Card className="bg-card/80 border-border/20 shadow-sm sticky top-0 z-10">
            <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                <Skeleton className="h-5 w-1/5" />
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-2">
                <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[240px] rounded-md" />
                <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md" />
                <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md" />
            </CardContent>
        </Card>

        {/* History List Skeleton */}
         <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-1">
                <div className="flex flex-col gap-2 pb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                       <Card key={i} className="rounded-lg p-3 w-full border-border/20 bg-card/70">
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="flex-grow min-w-0 space-y-1.5">
                              <Skeleton className="h-4 w-3/4" />
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <Skeleton className="h-3 w-1/6" />
                                <Skeleton className="h-3 w-1/4" />
                                <Skeleton className="h-3 w-1/5" />
                                <Skeleton className="h-5 w-1/4 rounded-full" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 mt-2 sm:mt-0">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-7 w-7 rounded-md" />
                            </div>
                          </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
         </div>
    </div>
);
