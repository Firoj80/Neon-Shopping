// src/app/(app)/stats/page.tsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { ExpenseChart } from '@/components/charts/expense-chart';
import type { ProcessedExpenseData } from '@/components/charts/expense-chart';
import { CategoryPieChart } from '@/components/charts/category-pie-chart';
import type { CategoryData } from '@/components/charts/category-pie-chart';
import { useAppContext } from '@/context/app-context';
import type { Category, List, ShoppingListItem } from '@/context/app-context';
import { subDays, format, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, WalletCards, CalendarDays, Filter, Layers, PieChart as PieChartIcon, BarChart3, Download } from 'lucide-react'; // Removed Lock
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { ChartConfig } from '@/components/ui/chart';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 
// Removed Link import

type TrendChartType = 'line' | 'bar';
type CategoryChartType = 'pie' | 'bar';
type TimePeriodPreset = '7d' | '30d' | '90d' | 'custom';
type CategoryFilter = string; 
type ListFilter = string | null; 

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function StatsPage() {
    const { state, formatCurrency, isLoading: appContextIsLoading } = useAppContext();
    // Removed isPremium from state, all features are available
    const { shoppingListItems, categories: appCategories, lists: appLists, userId } = state;

    const [trendChartType, setTrendChartType] = useState<TrendChartType>('line');
    const [categoryChartType, setCategoryChartType] = useState<CategoryChartType>('pie');
    const [timePeriodPreset, setTimePeriodPreset] = useState<TimePeriodPreset>('30d');
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, 29));
        return { from: startDate, to: endDate };
    });
    const [selectedListId, setSelectedListId] = useState<ListFilter>(null);

    const isLoading = appContextIsLoading;


    useEffect(() => {
        if (timePeriodPreset === 'custom' || !dateRange) return; 
        const now = new Date();
        let newStartDate: Date;
        const newEndDate = endOfDay(now);
        switch (timePeriodPreset) {
            case '7d': newStartDate = startOfDay(subDays(now, 6)); break;
            case '90d': newStartDate = startOfDay(subDays(now, 89)); break;
            case '30d':
            default: newStartDate = startOfDay(subDays(now, 29)); break;
        }
         if (!isSameDay(dateRange.from!, newStartDate) || !isSameDay(dateRange.to!, newEndDate)) {
            setDateRange({ from: newStartDate, to: newEndDate });
        }
    }, [timePeriodPreset, dateRange]); // Added dateRange to dependency to avoid stale closure

    const handleDateRangeChange = (newRange: DateRange | undefined) => {
        setDateRange(newRange);
        if (newRange?.from && newRange?.to) {
           setTimePeriodPreset('custom');
        }
    };

    const filteredItems = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to || !Array.isArray(shoppingListItems)) return [];
        const startDate = startOfDay(dateRange.from);
        const endDate = endOfDay(dateRange.to);

        return shoppingListItems.filter(item => {
            if (!item.checked || item.userId !== userId) return false; // Filter by current user
            if (selectedListId !== null && item.listId !== selectedListId) return false;
            const itemDate = new Date(item.dateAdded);
            const isWithinDate = isWithinInterval(itemDate, { start: startDate, end: endDate });
            const isMatchingCategory = selectedCategory === 'all' || item.category === selectedCategory;
            return isWithinDate && isMatchingCategory;
        });
    }, [shoppingListItems, dateRange, selectedCategory, selectedListId, userId]);

    const processedTrendData = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return [];
        const startDate = startOfDay(dateRange.from);
        const endDate = endOfDay(dateRange.to);
        const dailyTotals: Record<string, number> = {};
        const datesInRange = eachDayOfInterval({ start: startDate, end: endDate });
        
        datesInRange.forEach(date => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            dailyTotals[formattedDate] = 0;
        });

        filteredItems.forEach(item => {
            const itemDate = format(new Date(item.dateAdded), 'yyyy-MM-dd');
             if (dailyTotals.hasOwnProperty(itemDate)) {
                dailyTotals[itemDate] += item.quantity * item.price;
             }
        });

        const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        let dateFormatVal = 'MMM dd';
        if (durationDays <= 7) dateFormatVal = 'eee';
        else if (durationDays > 90) dateFormatVal = 'MMM yy';

        const dateMap = new Map<string, Date>();
        Object.keys(dailyTotals).forEach(dateStr => {
             dateMap.set(dateStr, parseISO(dateStr + 'T00:00:00Z')); // Ensure correct parsing
        });

        const formattedData: ProcessedExpenseData[] = Object.entries(dailyTotals)
          .map(([dateStr, total]) => ({
             date: format(dateMap.get(dateStr)!, dateFormatVal),
             total,
           }))
          .sort((a, b) => {
              const dateAStr = [...dateMap.entries()].find(([_, d]) => format(d, dateFormatVal) === a.date)?.[0];
              const dateBStr = [...dateMap.entries()].find(([_, d]) => format(d, dateFormatVal) === b.date)?.[0];
              if (!dateAStr || !dateBStr) return 0;
              return dateMap.get(dateAStr)!.getTime() - dateMap.get(dateBStr)!.getTime();
          });
        return formattedData;
    }, [filteredItems, dateRange]);

     const processedCategoryData = useMemo(() => {
         const categoryTotals: Record<string, { total: number; name: string }> = {};
         filteredItems.forEach(item => {
             const categoryId = item.category;
             const categoryName = appCategories.find(c => c.id === categoryId)?.name || 'Uncategorized';
             if (!categoryTotals[categoryId]) {
                 categoryTotals[categoryId] = { total: 0, name: categoryName };
             }
             categoryTotals[categoryId].total += item.quantity * item.price;
         });
         const totalSpentVal = Object.values(categoryTotals).reduce((sum, catData) => sum + catData.total, 0);
         if (totalSpentVal === 0) return []; // Return empty if nothing spent
         const categoryData: CategoryData[] = Object.entries(categoryTotals)
             .map(([_, catData]) => ({
                 category: catData.name,
                 total: catData.total,
             }))
             .sort((a, b) => b.total - a.total); // Sort by total descending
         return categoryData;
     }, [filteredItems, appCategories]);

     const dynamicChartConfig = useMemo(() => {
        const config: ChartConfig = { total: { label: "Total Spend", color: "hsl(var(--primary))" } };
        const availableColors = [
            "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
            "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(150 100% 50%)",
            "hsl(270 100% 60%)", "hsl(30 100% 50%)",
            "hsl(210 100% 60%)", "hsl(330 100% 60%)"
        ];
        let colorIndex = 0;
        appCategories.forEach(cat => {
          if (cat.name) { // Ensure name exists
            config[cat.name] = {
              label: cat.name,
              color: availableColors[colorIndex % availableColors.length],
            };
            colorIndex++;
          }
        });
        config['Uncategorized'] = { label: "Uncategorized", color: "hsl(0 0% 70%)" }; // A neutral color
        return config;
     }, [appCategories]);

     const summaryStats = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return { totalSpent: 0, averagePerDayInRange: 0, averagePerSpendingDay: 0, highestSpendDay: null, totalItems: 0 };
        const totalSpent = filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const daysWithSpending = new Set(filteredItems.map(item => format(new Date(item.dateAdded), 'yyyy-MM-dd')));
        const numberOfDaysWithSpending = Math.max(1, daysWithSpending.size); // Avoid division by zero
         const start = startOfDay(dateRange.from);
         const end = endOfDay(dateRange.to);
         const numberOfDaysInRange = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1);
         const averagePerDayInRange = totalSpent / numberOfDaysInRange;
         const averagePerSpendingDay = totalSpent / numberOfDaysWithSpending;
         const highestSpendDayData = processedTrendData.reduce(
            (max, day) => (day.total > max.total ? day : max),
            { date: '', total: -Infinity } // Initialize with -Infinity for correct comparison
          );
         const totalItems = filteredItems.length;
        return { totalSpent, averagePerDayInRange, averagePerSpendingDay, highestSpendDay: highestSpendDayData.total > -Infinity ? highestSpendDayData : null, totalItems };
    }, [filteredItems, processedTrendData, dateRange]);

     const getCategoryName = (categoryId: string): string => {
        return appCategories.find(cat => cat.id === categoryId)?.name || 'Uncategorized';
     };

    const getFilterLabel = () => {
        let dateLabel = '';
        const listName = selectedListId === null ? 'All Lists' : appLists.find(list => list.id === selectedListId && list.userId === userId)?.name || 'Unknown List';
         if (timePeriodPreset !== 'custom' && dateRange?.from && dateRange?.to) {
             switch (timePeriodPreset) {
                case '7d': dateLabel = 'Last 7d'; break;
                case '30d': dateLabel = 'Last 30d'; break;
                case '90d': dateLabel = 'Last 90d'; break;
             }
         } else if (dateRange?.from && dateRange?.to) {
             dateLabel = `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`;
         } else {
             dateLabel = 'Select Dates';
         }
        const categoryLabel = selectedCategory === 'all' ? '' : ` (${getCategoryName(selectedCategory)})`;
        return `${listName} | ${dateLabel}${categoryLabel}`;
    };

    const handleExportPDF = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        doc.text("Expense Dashboard Report", 14, 16);
        doc.setFontSize(10);
        doc.text(`Filters: ${getFilterLabel()}`, 14, 22);

        const summaryData = [
            ["Metric", "Value"],
            ["Total Spent", formatCurrency(summaryStats.totalSpent)],
            ["Total Items Purchased", String(summaryStats.totalItems)],
            ["Avg. Spend / Day (in range)", formatCurrency(summaryStats.averagePerDayInRange)],
            ["Avg. Spend / Day (spending days)", formatCurrency(summaryStats.averagePerSpendingDay)],
            ["Highest Spend Day", summaryStats.highestSpendDay ? `${summaryStats.highestSpendDay.date}: ${formatCurrency(summaryStats.highestSpendDay.total)}` : "N/A"],
        ];
        doc.autoTable({
            startY: 30,
            head: [summaryData[0]],
            body: summaryData.slice(1),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1.5, halign: 'left' },
            headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' }, // Themed head
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        let lastY = (doc as any).lastAutoTable.finalY || 30;

        if (processedTrendData.length > 0) {
            doc.text("Expense Trend", 14, lastY + 10);
            const trendTableData = processedTrendData.map(item => [item.date, formatCurrency(item.total)]);
            doc.autoTable({
                startY: lastY + 15,
                head: [["Date", "Total Spent"]],
                body: trendTableData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 1.5 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            });
            lastY = (doc as any).lastAutoTable.finalY;
        }

        if (processedCategoryData.length > 0) {
            doc.text("Category Breakdown", 14, lastY + 10);
            const categoryTableData = processedCategoryData.map(item => [item.category, formatCurrency(item.total)]);
            doc.autoTable({
                startY: lastY + 15,
                head: [["Category", "Total Spent"]],
                body: categoryTableData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 1.5 },
                headStyles: { fillColor: [230, 126, 34], textColor: 255, fontStyle: 'bold' },
            });
        }
        doc.save('expense_dashboard_report.pdf');
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
        }
    };

    const handleExportCSV = () => {
        let csvContent = "Data Type,Value 1,Value 2\r\n";
        // Summary Stats
        csvContent += "Summary Statistics,\r\n";
        csvContent += `"Metric","Value"\r\n`;
        csvContent += `"Total Spent","${summaryStats.totalSpent}"\r\n`; // Raw number for CSV
        csvContent += `"Total Items Purchased","${summaryStats.totalItems}"\r\n`;
        csvContent += `"Avg. Spend / Day (in range)","${summaryStats.averagePerDayInRange}"\r\n`;
        csvContent += `"Avg. Spend / Day (spending days)","${summaryStats.averagePerSpendingDay}"\r\n`;
        csvContent += `"Highest Spend Day Date","${summaryStats.highestSpendDay?.date || 'N/A'}"\r\n`;
        csvContent += `"Highest Spend Amount","${summaryStats.highestSpendDay?.total || 'N/A'}"\r\n`;
        csvContent += "\r\n";

        // Trend Data
        csvContent += "Expense Trend Data,\r\n";
        csvContent += `"Date","Total Spent"\r\n`;
        processedTrendData.forEach(item => {
            csvContent += `"${item.date}","${item.total}"\r\n`; // Raw number
        });
        csvContent += "\r\n";

        // Category Data
        csvContent += "Category Breakdown Data,\r\n";
        csvContent += `"Category","Total Spent"\r\n`;
        processedCategoryData.forEach(item => {
            const safeCategory = `"${item.category.replace(/"/g, '""')}"`; // Escape double quotes
            csvContent += `${safeCategory},"${item.total}"\r\n`;
        });

        downloadCSV(csvContent, 'expense_dashboard_report.csv');
    };


    if (isLoading) {
        return <StatsPageSkeleton />;
    }

    // No premium check needed
    return (
         <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0 h-full">
             <div className="flex justify-between items-center">
                 <h1 className="text-xl sm:text-2xl font-bold text-primary">Expense Dashboard</h1>
                <div className="flex gap-2">
                    <Button onClick={handleExportPDF} variant="outline" size="sm" className="glow-border-inner text-xs px-2 py-1 h-auto sm:px-3">
                        <Download className="h-3.5 w-3.5 mr-1 sm:mr-1.5" /> PDF
                    </Button>
                    <Button onClick={handleExportCSV} variant="outline" size="sm" className="glow-border-inner text-xs px-2 py-1 h-auto sm:px-3">
                        <Download className="h-3.5 w-3.5 mr-1 sm:mr-1.5" /> CSV
                    </Button>
                </div>
             </div>

             <Card className="bg-background/95 border-border/20 shadow-sm sticky top-0 z-10 backdrop-blur-sm glow-border">
                 <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                      <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2 mb-2 sm:mb-0">
                         <Filter className="h-4 w-4" /> Filters
                      </CardTitle>
                 </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-2">
                     <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                          <Select value={selectedListId === null ? 'all' : selectedListId} onValueChange={(value: string) => setSelectedListId(value === 'all' ? null : value)}>
                              <SelectTrigger className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-primary text-xs sm:text-sm glow-border-inner">
                                 <WalletCards className="h-4 w-4 mr-2 opacity-70" />
                                 <SelectValue placeholder="Select Shopping List" />
                             </SelectTrigger>
                             <SelectContent className="bg-card border-secondary/80 text-neonText glow-border-inner">
                                 <SelectGroup>
                                     <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Shopping List</SelectLabel>
                                     <SelectItem value="all" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">All Lists</SelectItem>
                                     {appLists.filter(list => list.userId === userId).map((list) => ( // Filter lists by current user
                                         <SelectItem key={list.id} value={list.id} className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">{list.name}</SelectItem>
                                     ))}
                                      {appLists.filter(list => list.userId === userId).length === 0 && <SelectItem value="no-lists" disabled>No lists available</SelectItem>}
                                 </SelectGroup>
                             </SelectContent>
                         </Select>
                     </div>
                     <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
                          <Select value={timePeriodPreset} onValueChange={(value: TimePeriodPreset) => setTimePeriodPreset(value)}>
                              <SelectTrigger className="w-full border-secondary/50 focus:border-secondary focus:shadow-secondary focus:ring-secondary [&[data-state=open]]:border-primary [&[data-state=open]]:shadow-primary text-xs sm:text-sm glow-border-inner">
                                 <CalendarDays className="h-4 w-4 mr-2 opacity-70" />
                                 <SelectValue placeholder="Select time period" />
                             </SelectTrigger>
                             <SelectContent className="bg-card border-secondary/80 text-neonText glow-border-inner">
                                 <SelectItem value="7d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">Last 7 Days</SelectItem>
                                 <SelectItem value="30d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">Last 30 Days</SelectItem>
                                 <SelectItem value="90d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">Last 90 Days</SelectItem>
                                 <SelectItem value="custom" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">Custom Range</SelectItem>
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
                              <SelectTrigger className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-primary text-xs sm:text-sm glow-border-inner">
                                  <Layers className="h-4 w-4 mr-2 opacity-70" />
                                 <SelectValue placeholder="Filter by category" />
                             </SelectTrigger>
                              <SelectContent
                                 className="bg-card border-primary/80 text-neonText max-h-60 overflow-y-auto glow-border-inner"
                                 position="popper"
                               >
                                  <ScrollArea className="h-full">
                                     <SelectGroup>
                                         <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Category</SelectLabel>
                                         <SelectItem value="all" className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-xs sm:text-sm">All Categories</SelectItem>
                                         {appCategories.filter(c => c.userId === userId || c.userId === null).map((category) => ( // Show user's and global categories
                                             <SelectItem key={category.id} value={category.id} className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary cursor-pointer py-2 text-xs sm:text-sm">
                                                 {category.name}
                                             </SelectItem>
                                         ))}
                                         {appCategories.filter(c => c.userId === userId || c.userId === null).length === 0 && <SelectItem value="none" disabled>No categories defined</SelectItem>}
                                     </SelectGroup>
                                  </ScrollArea>
                             </SelectContent>
                         </Select>
                     </div>
                 </CardContent>
             </Card>

             <div className="flex-grow overflow-y-auto mt-4">
                 <div className="space-y-4 sm:space-y-6 pb-6">
                     <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                         <Card className="bg-card border-primary/30 shadow-neon glow-border-inner">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                             <CardTitle className="text-xs sm:text-sm font-medium text-primary">Total Spent</CardTitle>
                             <WalletCards className="h-4 w-4 text-muted-foreground" />
                             </CardHeader>
                             <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5">
                             <div className="text-lg sm:text-2xl font-bold text-neonText">{formatCurrency(summaryStats.totalSpent)}</div>
                             <p className="text-xs text-muted-foreground">{summaryStats.totalItems} items ({getFilterLabel()})</p>
                             </CardContent>
                         </Card>
                         <Card className="bg-card border-secondary/30 shadow-neon glow-border-inner">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                             <CardTitle className="text-xs sm:text-sm font-medium text-secondary">Avg. Spend / Day</CardTitle>
                             <TrendingUp className="h-4 w-4 text-muted-foreground" />
                             </CardHeader>
                             <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5">
                             <div className="text-lg sm:text-2xl font-bold text-neonText">{formatCurrency(summaryStats.averagePerDayInRange)}</div>
                             <p className="text-xs text-muted-foreground">Avg/spending day: {formatCurrency(summaryStats.averagePerSpendingDay)}</p>
                             </CardContent>
                         </Card>
                         <Card className="bg-card border-yellow-500/30 shadow-neon glow-border-inner">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                             <CardTitle className="text-xs sm:text-sm font-medium text-yellow-500">Highest Spend Day</CardTitle>
                             <CalendarDays className="h-4 w-4 text-muted-foreground" />
                             </CardHeader>
                             <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5">
                             {summaryStats.highestSpendDay ? (
                                 <>
                                     <div className="text-lg sm:text-2xl font-bold text-neonText">{formatCurrency(summaryStats.highestSpendDay.total)}</div>
                                     <p className="text-xs text-muted-foreground">on {summaryStats.highestSpendDay.date}</p>
                                 </>
                             ) : (
                                 <div className="text-lg font-bold text-muted-foreground">-</div>
                             )}
                             </CardContent>
                         </Card>
                         <Card className="bg-card border-green-500/30 shadow-neon glow-border-inner">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                             <CardTitle className="text-xs sm:text-sm font-medium text-green-500">Items Purchased</CardTitle>
                             <Layers className="h-4 w-4 text-muted-foreground" />
                             </CardHeader>
                             <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5">
                             <div className="text-lg sm:text-2xl font-bold text-neonText">{summaryStats.totalItems}</div>
                                 <p className="text-xs text-muted-foreground">{getFilterLabel()}</p>
                             </CardContent>
                         </Card>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                         <Card className="bg-card border-primary/30 shadow-neon lg:col-span-1 glow-border-inner">
                             <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                                 <div>
                                     <CardTitle className="text-base sm:text-lg text-primary">Expense Trend</CardTitle>
                                     <CardDescription className="text-xs text-muted-foreground mt-1">{getFilterLabel()}</CardDescription>
                                 </div>
                                 <div className="flex items-center gap-1 border border-border/30 p-1 rounded-md self-start sm:self-center">
                                     <Button
                                         variant={trendChartType === 'line' ? 'secondary' : 'ghost'}
                                         size="icon"
                                         onClick={() => setTrendChartType('line')}
                                         className={`h-7 w-7 ${trendChartType === 'line' ? 'bg-secondary/50 text-secondary-foreground shadow-sm' : 'text-muted-foreground'}`}
                                         aria-label="Show as Line Chart"
                                     > <BarChart3 className="h-4 w-4 transform rotate-90" /> </Button>
                                     <Button
                                         variant={trendChartType === 'bar' ? 'secondary' : 'ghost'}
                                         size="icon"
                                         onClick={() => setTrendChartType('bar')}
                                         className={`h-7 w-7 ${trendChartType === 'bar' ? 'bg-secondary/50 text-secondary-foreground shadow-sm' : 'text-muted-foreground'}`}
                                         aria-label="Show as Bar Chart"
                                     > <BarChart3 className="h-4 w-4" /> </Button>
                                 </div>
                             </CardHeader>
                             <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4">
                                 {processedTrendData.length > 0 ? (
                                     <ExpenseChart data={processedTrendData} chartType={trendChartType} chartConfig={dynamicChartConfig} />
                                 ) : (
                                     <div className="flex items-center justify-center h-[200px] sm:h-[300px]">
                                         <p className="text-muted-foreground text-center text-sm">No expense data available for the selected filters.</p>
                                     </div>
                                 )}
                             </CardContent>
                         </Card>

                         <Card className="bg-card border-secondary/30 shadow-neon lg:col-span-1 glow-border-inner">
                             <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                                 <div>
                                     <CardTitle className="text-base sm:text-lg text-secondary flex items-center gap-2">
                                         <Layers className="h-5 w-5" /> Category Breakdown
                                     </CardTitle>
                                     <CardDescription className="text-xs text-muted-foreground mt-1">{getFilterLabel()}</CardDescription>
                                 </div>
                                 <div className="flex items-center gap-1 border border-border/30 p-1 rounded-md self-start sm:self-center">
                                     <Button
                                             variant={categoryChartType === 'pie' ? 'primary' : 'ghost'}
                                             size="icon"
                                             onClick={() => setCategoryChartType('pie')}
                                             className={`h-7 w-7 ${categoryChartType === 'pie' ? 'bg-primary/50 text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                                             aria-label="Show as Pie Chart"
                                         > <PieChartIcon className="h-4 w-4" /> </Button>
                                         <Button
                                             variant={categoryChartType === 'bar' ? 'primary' : 'ghost'}
                                             size="icon"
                                             onClick={() => setCategoryChartType('bar')}
                                             className={`h-7 w-7 ${categoryChartType === 'bar' ? 'bg-primary/50 text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                                             aria-label="Show as Bar Chart"
                                         > <BarChart3 className="h-4 w-4" /> </Button>
                                     </div>
                             </CardHeader>
                             <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4">
                                 {processedCategoryData.length > 0 ? (
                                     categoryChartType === 'pie' ? (
                                         <CategoryPieChart data={processedCategoryData} chartConfig={dynamicChartConfig} />
                                     ) : (
                                         <ExpenseChart data={processedCategoryData.map(d => ({ date: d.category, total: d.total }))} chartType="bar" keyPrefix="category" chartConfig={dynamicChartConfig}/>
                                     )
                                 ) : (
                                     <div className="flex items-center justify-center h-[200px] sm:h-[300px]">
                                         <p className="text-muted-foreground text-center text-sm">No spending by category for the selected filters.</p>
                                     </div>
                                 )}
                             </CardContent>
                         </Card>
                     </div>
                 </div>
             </div>
         </div>
    );
}

const StatsPageSkeleton: React.FC = () => (
    <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0 h-full animate-pulse">
         <div className="flex justify-between items-center">
             <Skeleton className="h-7 w-2/5 sm:h-8 sm:w-1/3" />
             <div className="flex gap-2">
                 <Skeleton className="h-8 w-16 rounded-md" />
                 <Skeleton className="h-8 w-16 rounded-md" />
             </div>
         </div>

        <Card className="bg-card/80 border-border/20 shadow-sm sticky top-0 z-10 glow-border">
            <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                 <Skeleton className="h-5 w-1/4 mb-2 sm:mb-0" />
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-2">
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[160px] rounded-md" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[240px] rounded-md" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md" />
            </CardContent>
        </Card>

         <div className="flex-grow overflow-y-auto mt-4">
            <div className="space-y-4 sm:space-y-6 pb-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="bg-card border-border/20 shadow-md glow-border-inner">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                                <Skeleton className="h-4 w-3/5" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5">
                                <Skeleton className="h-6 w-1/2 sm:h-7 mb-1" />
                                <Skeleton className="h-3 w-3/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <Card className="bg-card border-border/20 shadow-md lg:col-span-1 glow-border-inner">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                            <div className="w-3/5 space-y-1">
                                <Skeleton className="h-5 sm:h-6 w-4/5" />
                                <Skeleton className="h-4 w-3/5" />
                            </div>
                            <Skeleton className="h-8 w-16 rounded-md" />
                        </CardHeader>
                        <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4 h-[248px] sm:h-[348px] flex items-center justify-center">
                            <Skeleton className="h-4/5 w-11/12" />
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border/20 shadow-md lg:col-span-1 glow-border-inner">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                            <div className="w-3/5 space-y-1">
                                <Skeleton className="h-5 sm:h-6 w-full" />
                                <Skeleton className="h-4 w-3/5" />
                            </div>
                            <Skeleton className="h-8 w-16 rounded-md" />
                        </CardHeader>
                        <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4 h-[248px] sm:h-[348px] flex items-center justify-center">
                            <Skeleton className="h-4/5 w-4/5 rounded-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
         </div>
    </div>
);
