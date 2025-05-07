
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import type { ShoppingListItem, Category, List } from '@/context/app-context';
import { subDays, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Filter, Layers, CalendarDays, Tag, Trash2, WalletCards, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type CategoryFilter = string; // 'all' or specific category ID
type SortOption = 'dateDesc' | 'dateAsc' | 'priceDesc' | 'priceAsc';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}


export default function HistoryPage() {
    const { state, dispatch, formatCurrency, isLoading } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [sortOption, setSortOption] = useState<SortOption>('dateDesc');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, 29));
        return { from: startDate, to: endDate };
    });
    const [selectedListId, setSelectedListId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedListId === undefined && state.lists.length > 0) {
            setSelectedListId(state.lists[0].id);
        } else if (state.lists.length === 0 && selectedListId !== null) {
            setSelectedListId(null);
        }
    }, [state.lists, selectedListId]);


    const historyItems = useMemo(() => {
        let items: ShoppingListItem[] = Array.isArray(state.shoppingListItems) ? state.shoppingListItems.filter(item => item.checked) : [];

         if (selectedListId !== null) {
            items = items.filter(item => item.listId === selectedListId);
        }

        if (dateRange?.from && dateRange?.to) {
            const startDate = startOfDay(dateRange.from);
            const endDate = endOfDay(dateRange.to);
            items = items.filter(item => {
                const itemDate = new Date(item.dateAdded);
                return isWithinInterval(itemDate, { start: startDate, end: endDate });
            });
        }

        if (selectedCategory !== 'all') {
            items = items.filter(item => item.category === selectedCategory);
        }

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
    }, [state.shoppingListItems, dateRange, selectedCategory, sortOption, selectedListId]);

    const handleDateRangeChange = (newRange: DateRange | undefined) => {
        setDateRange(newRange);
    };

     const handleDeleteItem = (id: string) => {
        setItemToDelete(id);
     };

     const confirmDelete = () => {
        if (itemToDelete) {
          dispatch({ type: 'REMOVE_SHOPPING_ITEM', payload: itemToDelete });
          setItemToDelete(null);
        }
     };

    const getCategoryName = (categoryId: string): string => {
      return state.categories.find(cat => cat.id === categoryId)?.name || 'Uncategorized';
    };

    const getFilterLabel = () => {
      let dateLabel = 'All Time';
       if (dateRange?.from && dateRange?.to) {
           dateLabel = `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`;
       }
      const categoryLabel = selectedCategory === 'all' ? '' : ` (${getCategoryName(selectedCategory)})`;
      const listName = selectedListId === null ? 'All Lists' : state.lists.find(list => list.id === selectedListId)?.name || 'Unknown List';

      return `${listName} | ${dateLabel}${categoryLabel}`;
    };

     const handleExportPDF = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        const tableCellStyles = { fontSize: 8 };
        const tableHeaderStyles = { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' };

        doc.setFontSize(18);
        doc.text("Neon Shopping - Purchase History Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Report Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, 32);
        doc.text(`Filters Applied: ${getFilterLabel()}`, 14, 38);

        const tableData = historyItems.map(item => [
            item.name,
            item.quantity,
            formatCurrency(item.price),
            formatCurrency(item.price * item.quantity),
            getCategoryName(item.category),
            format(new Date(item.dateAdded), 'MMM d, yyyy')
        ]);

        doc.autoTable({
            startY: 45,
            head: [['Item Name', 'Qty', 'Price', 'Total', 'Category', 'Date Purchased']],
            body: tableData,
            theme: 'grid',
            headStyles: tableHeaderStyles,
            styles: tableCellStyles,
        });

        doc.save('purchase_history_report.pdf');
    };

    const downloadCSV = (csvContent: string, fileName: string) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const handleExportCSV = () => {
        let csvContent = "";
        const headers = ["Item Name", "Quantity", "Price", "Total Price", "Category", "Date Purchased", "List Name"];
        csvContent += headers.join(",") + "\r\n";

        historyItems.forEach(item => {
            const listName = state.lists.find(l => l.id === item.listId)?.name || 'N/A';
            const row = [
                `"${item.name.replace(/"/g, '""')}"`, // Escape double quotes
                item.quantity,
                item.price, // Raw number for CSV
                item.price * item.quantity, // Raw number
                `"${getCategoryName(item.category).replace(/"/g, '""')}"`,
                format(new Date(item.dateAdded), 'yyyy-MM-dd'),
                `"${listName.replace(/"/g, '""')}"`
            ];
            csvContent += row.join(",") + "\r\n";
        });

        downloadCSV(csvContent, 'purchase_history_report.csv');
    };


    if (isLoading) {
        return <HistoryPageSkeleton />;
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0 h-full">
            <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
                <History className="h-6 w-6" /> Purchase History
            </h1>

              <Card className="bg-background/95 border-border/20 shadow-sm sticky top-0 z-10 backdrop-blur-sm glow-border-inner">
                  <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2 mb-2 sm:mb-0">
                                <Filter className="h-4 w-4" /> Filters & Sort
                            </CardTitle>
                             <div className="flex gap-2">
                                <Button onClick={handleExportPDF} variant="outline" size="sm" className="glow-border-inner text-xs px-2 py-1 h-auto sm:px-3">
                                    <Download className="h-3.5 w-3.5 mr-1 sm:mr-1.5" /> Export PDF
                                </Button>
                                <Button onClick={handleExportCSV} variant="outline" size="sm" className="glow-border-inner text-xs px-2 py-1 h-auto sm:px-3">
                                    <Download className="h-3.5 w-3.5 mr-1 sm:mr-1.5" /> Export CSV
                                </Button>
                            </div>
                        </div>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-2">
                      <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                           <Select value={selectedListId === null ? 'all' : selectedListId} onValueChange={(value: string) => setSelectedListId(value === 'all' ? null : value)} disabled={state.lists.length === 0}>
                               <SelectTrigger className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary text-xs sm:text-sm glow-border-inner">
                                  <WalletCards className="h-4 w-4 mr-2 opacity-70" />
                                 <SelectValue placeholder="Select Shopping List" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-secondary/80 text-neonText glow-border-inner">
                                  <SelectGroup>
                                      <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Shopping List</SelectLabel>
                                      <SelectItem value="all" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">All Lists</SelectItem>
                                      {state.lists.length > 0 ? (
                                        state.lists.map((list) => (
                                            <SelectItem key={list.id} value={list.id} className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">{list.name}</SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="no-lists" disabled>No lists available</SelectItem>
                                      )}
                                  </SelectGroup>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[240px]">
                          <DateRangePicker
                              range={dateRange}
                              onRangeChange={handleDateRangeChange}
                              triggerClassName="w-full justify-start text-left font-normal text-xs sm:text-sm glow-border-inner"
                              align="start"
                          />
                      </div>
                      <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                          <Select value={selectedCategory} onValueChange={(value: CategoryFilter) => setSelectedCategory(value)}>
                              <SelectTrigger className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary text-xs sm:text-sm glow-border-inner">
                                  <Layers className="h-4 w-4 mr-2 opacity-70" />
                                  <SelectValue placeholder="Filter by category" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-primary/80 text-neonText max-h-60 overflow-y-auto glow-border-inner" position="popper">
                                  <ScrollArea className="h-full">
                                      <SelectGroup>
                                          <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Category</SelectLabel>
                                          <SelectItem value="all" className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-xs sm:text-sm">All Categories</SelectItem>
                                          {state.categories.map((category) => (
                                              <SelectItem key={category.id} value={category.id} className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-xs sm:text-sm">
                                                  {category.name}
                                              </SelectItem>
                                          ))}
                                          {state.categories.length === 0 && <SelectItem value="none" disabled>No categories defined</SelectItem>}
                                      </SelectGroup>
                                  </ScrollArea>
                              </SelectContent>
                          </Select>
                      </div>
                       <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                          <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                              <SelectTrigger className="w-full border-secondary/50 focus:border-secondary focus:shadow-secondary focus:ring-secondary text-xs sm:text-sm glow-border-inner">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
                                  <SelectValue placeholder="Sort by..." />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-secondary/80 text-neonText glow-border-inner" position="popper">
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

            <div className="flex-grow overflow-y-auto mt-4">
                <ScrollArea className="h-full pr-1">
                    {historyItems.length > 0 ? (
                        <div className="flex flex-col gap-2 pb-4">
                            {historyItems.map((item) => (
                                <HistoryItemCard key={item.id} item={item} formatCurrency={formatCurrency} onDelete={handleDeleteItem} getCategoryName={getCategoryName}/>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center py-10">
                            <p className="text-muted-foreground">No purchase history found for the selected filters ({getFilterLabel()}).</p>
                        </div>
                    )}
                </ScrollArea>
            </div>

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="glow-border">
                    <AlertDialogHeader>
                    <AlertDialogTitle>Delete Item from History?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the item from your shopping list and history.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)} className="glow-border-inner">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-border-inner">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

interface HistoryItemCardProps {
    item: ShoppingListItem;
    formatCurrency: (amount: number) => string;
    onDelete: (id: string) => void;
    getCategoryName: (id: string) => string;
}

const HistoryItemCard: React.FC<HistoryItemCardProps> = ({ item, formatCurrency, onDelete, getCategoryName }) => {
  const purchaseDate = format(new Date(item.dateAdded), 'MMM d, yyyy');
  const totalItemPrice = item.price * item.quantity;
  const categoryName = getCategoryName(item.category);

  return (
    <Card className="rounded-lg shadow-sm p-3 w-full border-secondary/20 bg-card/70 hover:border-secondary/40 transition-colors duration-200 glow-border-inner">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium leading-tight text-neonText/90">{item.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            <span>Qty: {item.quantity}</span>
            <span>Price: {formatCurrency(item.price)}</span>
            <span className="font-medium text-neonText/80">Total: {formatCurrency(totalItemPrice)}</span>
            <Badge variant="secondary" className="py-0.5 px-1.5 text-xs bg-secondary/20 text-secondary border-secondary/30">
              <Tag className="h-3 w-3 mr-1" />{categoryName}
            </Badge>
          </div>
        </div>

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

const HistoryPageSkeleton: React.FC = () => (
    <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0 h-full animate-pulse">
        <Skeleton className="h-7 w-2/5 sm:h-8 sm:w-1/3" />

        <Card className="bg-card/80 border-border/20 shadow-sm sticky top-0 z-10 glow-border-inner">
            <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <Skeleton className="h-5 w-1/4 mb-2 sm:mb-0" /> {/* Title */}
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-24 rounded-md" /> {/* PDF Button */}
                        <Skeleton className="h-8 w-24 rounded-md" /> {/* CSV Button */}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-2">
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md" />
                <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[240px] rounded-md" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md" />
            </CardContent>
        </Card>

         <div className="flex-grow overflow-y-auto mt-4">
            <ScrollArea className="h-full pr-1">
                <div className="flex flex-col gap-2 pb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                       <Card key={i} className="rounded-lg p-3 w-full border-border/20 bg-card/70 glow-border-inner">
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
