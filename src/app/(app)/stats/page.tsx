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
import { TrendingUp, WalletCards, CalendarDays, Filter, Layers, PieChart as PieChartIcon, BarChart3, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { ChartConfig } from '@/components/ui/chart';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { showPreparedInterstitialAd } from '@/components/admob/ad-initializer';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function StatsPage() {
    const { state, formatCurrency, isLoading } = useAppContext();

    const [trendChartType, setTrendChartType] = useState<'line' | 'bar'>('line');
    const [categoryChartType, setCategoryChartType] = useState<'pie' | 'bar'>('pie');
    const [timePeriodPreset, setTimePeriodPreset] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, 29));
        return { from: startDate, to: endDate };
    });
    const [selectedListId, setSelectedListId] = useState<string | null>(null);

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
        setDateRange({ from: newStartDate, to: newEndDate });
    }, [timePeriodPreset]);


    const handleDateRangeChange = (newRange: DateRange | undefined) => {
        setDateRange(newRange);
        if (newRange?.from && newRange?.to) {
           setTimePeriodPreset('custom');
        }
    };

    const filteredItems = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to || !Array.isArray(state.shoppingListItems)) return [];
        const startDate = startOfDay(dateRange.from);
        const endDate = endOfDay(dateRange.to);
        const allShoppingItems = state.shoppingListItems;
        
        return allShoppingItems.filter(item => {
            if (!item.checked) return false; // Only purchased items
            if (selectedListId !== null && item.listId !== selectedListId) return false; // List Filter

            const itemDate = new Date(item.dateAdded);
            const isWithinDate = isWithinInterval(itemDate, { start: startDate, end: endDate });
            const isMatchingCategory = selectedCategory === 'all' || item.category === selectedCategory;
            return isWithinDate && isMatchingCategory;
        });
    }, [state.shoppingListItems, dateRange, selectedCategory, selectedListId]);

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
        let dateFormat = 'MMM dd';
        if (durationDays <= 7) dateFormat = 'eee';
        else if (durationDays > 90) dateFormat = 'MMM yy';

        const dateMap = new Map<string, Date>();
        Object.keys(dailyTotals).forEach(dateStr => {
             dateMap.set(dateStr, parseISO(dateStr + 'T00:00:00Z'));
        });

        const formattedData: ProcessedExpenseData[] = Object.entries(dailyTotals)
          .map(([dateStr, total]) => ({
             date: format(dateMap.get(dateStr)!, dateFormat), // Use mapped Date object
             total,
           }))
          .sort((a, b) => { // Sort based on actual Date objects for correctness
              const dateAStr = [...dateMap.entries()].find(([_, d]) => format(d, dateFormat) === a.date)?.[0];
              const dateBStr = [...dateMap.entries()].find(([_, d]) => format(d, dateFormat) === b.date)?.[0];
              if (!dateAStr || !dateBStr) return 0;
              return dateMap.get(dateAStr)!.getTime() - dateMap.get(dateBStr)!.getTime();
          });
        return formattedData;
    }, [filteredItems, dateRange]);

     const processedCategoryData = useMemo(() => {
         const categoryTotals: Record<string, { total: number; name: string }> = {};
         filteredItems.forEach(item => {
             const categoryId = item.category;
             const categoryName = state.categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
             if (!categoryTotals[categoryId]) {
                 categoryTotals[categoryId] = { total: 0, name: categoryName };
             }
             categoryTotals[categoryId].total += item.quantity * item.price;
         });

         const totalSpent = Object.values(categoryTotals).reduce((sum, catData) => sum + catData.total, 0);
         if (totalSpent === 0) return []; // Avoid division by zero or empty pie chart

         const categoryData: CategoryData[] = Object.entries(categoryTotals)
             .map(([_, catData]) => ({
                 category: catData.name,
                 total: catData.total,
             }))
             .sort((a, b) => b.total - a.total); // Sort for consistent pie chart display
         return categoryData;
     }, [filteredItems, state.categories]);

     const dynamicChartConfig = useMemo(() => {
        const config: ChartConfig = { total: { label: "Total Spend", color: "hsl(var(--primary))" } };
        // Consistent color palette for charts
        const availableColors = [
            "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
            "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(150 100% 50%)", // Lime Green (Example)
            "hsl(270 100% 60%)", "hsl(30 100% 50%)",  // Orange (Example)
            "hsl(210 100% 60%)", "hsl(330 100% 60%)"  // Pink (Example)
        ];
        let colorIndex = 0;
        state.categories.forEach(cat => {
          config[cat.name] = {
            label: cat.name,
            color: availableColors[colorIndex % availableColors.length], // Cycle through colors
          };
          colorIndex++;
        });
        config['Uncategorized'] = { label: "Uncategorized", color: "hsl(0 0% 70%)" }; // Muted grey for uncategorized
        return config;
     }, [state.categories]);


     const summaryStats = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return { totalSpent: 0, averagePerDayInRange: 0, averagePerSpendingDay: 0, highestSpendDay: null, totalItems: 0 };

        const totalSpent = filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const daysWithSpending = new Set(filteredItems.map(item => format(new Date(item.dateAdded), 'yyyy-MM-dd')));
        const numberOfDaysWithSpending = Math.max(1, daysWithSpending.size); // Avoid division by zero

         const start = startOfDay(dateRange.from);
         const end = endOfDay(dateRange.to);
         const numberOfDaysInRange = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1); // +1 to include both start and end day

         const averagePerDayInRange = totalSpent / numberOfDaysInRange;
         const averagePerSpendingDay = totalSpent / numberOfDaysWithSpending;

         const highestSpendDay = processedTrendData.reduce(
            (max, day) => (day.total > max.total ? day : max),
            { date: '', total: -1 } // Initialize with a value that will be overridden
          );

         const totalItems = filteredItems.length;

        return { totalSpent, averagePerDayInRange, averagePerSpendingDay, highestSpendDay: highestSpendDay.total >= 0 ? highestSpendDay : null, totalItems };
    }, [filteredItems, processedTrendData, dateRange]);


     const getCategoryName = (categoryId: string): string => {
        return state.categories.find(cat => cat.id === categoryId)?.name || 'Uncategorized';
     };

    const getFilterLabel = () => {
        let dateLabel = '';
        const listName = selectedListId === null ? 'All Lists' : state.lists.find(list => list.id === selectedListId)?.name || 'Unknown List';
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

    const handleExportPDF = async () => {
        await showPreparedInterstitialAd();
        const doc = new jsPDF() as jsPDFWithAutoTable;
        doc.setFontSize(18);
        doc.text('Expense Dashboard Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Filters: ${getFilterLabel()}`, 14, 30);
        doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, 36);

        // Summary Stats Table
        const summaryTableBody = [
            ['Total Spent', formatCurrency(summaryStats.totalSpent)],
            ['Average Spend / Day (in range)', formatCurrency(summaryStats.averagePerDayInRange)],
            ['Average Spend / Day (on spending days)', formatCurrency(summaryStats.averagePerSpendingDay)],
            ['Highest Spend Day', summaryStats.highestSpendDay ? `${formatCurrency(summaryStats.highestSpendDay.total)} on ${summaryStats.highestSpendDay.date}` : 'N/A'],
            ['Total Items Purchased', summaryStats.totalItems.toString()],
        ];
        doc.autoTable({
            head: [['Statistic', 'Value']],
            body: summaryTableBody,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [30, 130, 76] }, // Example: Darker green
        });
        let lastY = (doc as any).lastAutoTable.finalY;

        // Expense Trend Table (if data exists)
        if (processedTrendData.length > 0) {
            doc.text('Expense Trend Data', 14, lastY + 15);
            const trendTableColumns = ["Date", "Total Spent"];
            const trendTableRows = processedTrendData.map(d => [d.date, formatCurrency(d.total)]);
            doc.autoTable({
                head: [trendTableColumns],
                body: trendTableRows,
                startY: lastY + 20,
                theme: 'grid',
            });
            lastY = (doc as any).lastAutoTable.finalY;
        }

        // Category Breakdown Table (if data exists)
        if (processedCategoryData.length > 0) {
            doc.text('Category Breakdown Data', 14, lastY + 15);
            const categoryTableColumns = ["Category", "Total Spent"];
            const categoryTableRows = processedCategoryData.map(d => [d.category, formatCurrency(d.total)]);
            doc.autoTable({
                head: [categoryTableColumns],
                body: categoryTableRows,
                startY: lastY + 20,
                theme: 'grid',
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

    const handleExportCSV = async () => {
        await showPreparedInterstitialAd();
        let csvContent = "Data Type,Value 1,Value 2\r\n"; // Header for sections
        // Summary Stats
        csvContent += "Summary Statistics,\r\n"; // Section title
        csvContent += `Total Spent,"${summaryStats.totalSpent}"\r\n`; // Raw number, quoted for safety
        csvContent += `Average Spend / Day (in range),"${summaryStats.averagePerDayInRange}"\r\n`;
        csvContent += `Average Spend / Day (on spending days),"${summaryStats.averagePerSpendingDay}"\r\n`;
        csvContent += `Highest Spend Day,"${summaryStats.highestSpendDay ? `${summaryStats.highestSpendDay.total} on ${summaryStats.highestSpendDay.date}` : 'N/A'}"\r\n`;
        csvContent += `Total Items Purchased,"${summaryStats.totalItems}"\r\n`;
        csvContent += "\r\n"; // Empty line between sections

        // Trend Data
        csvContent += "Expense Trend Data,\r\n"; // Section title
        csvContent += '"Date","Total Spent"\r\n'; // Changed from backticks to double quotes
        processedTrendData.forEach(item => {
            csvContent += `"${item.date}","${item.total}"\n`; // Changed \r\n to \n
        });
        csvContent += "\r\n"; // Empty line

        // Category Data
        csvContent += "Category Breakdown Data,\r\n"; // Section title
        csvContent += '"Category","Total Spent"\r\n'; // Changed from backticks to double quotes
        processedCategoryData.forEach(item => {
            const safeCategory = `"${item.category.replace(/"/g, '""')}"`; // Escape double quotes in category name
            csvContent += `${safeCategory},"${item.total}"\r\n`; // Quoted total for safety, using \r\n
        });

        downloadCSV(csvContent, 'expense_dashboard_report.csv');
    };


    if (isLoading) {
        return <StatsPageSkeleton />;
    }

    return (
         <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0 h-full">
             {/* Header */}
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

             {/* Filter Section */}
            <Card className="bg-background/95 border-border/20 shadow-sm sticky top-0 z-10 backdrop-blur-sm glow-border">
                 <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                      <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2 mb-2 sm:mb-0">
                         <Filter className="h-4 w-4" /> Filters
                      </CardTitle>
                 </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-2">
                     {/* List Filter */}
                     <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                          <Select value={selectedListId === null ? 'all' : selectedListId} onValueChange={(value: string) => setSelectedListId(value === 'all' ? null : value)}>
                              <SelectTrigger className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary text-xs sm:text-sm glow-border-inner">
                                 <WalletCards className="h-4 w-4 mr-2 opacity-70" />
                                 <SelectValue placeholder="Select Shopping List" />
                             </SelectTrigger>
                             <SelectContent className="bg-card border-secondary/80 text-neonText glow-border-inner">
                                 <SelectGroup>
                                     <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Shopping List</SelectLabel>
                                     <SelectItem value="all" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">All Lists</SelectItem>
                                     {state.lists.map((list) => (
                                         <SelectItem key={list.id} value={list.id} className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary text-xs sm:text-sm">{list.name}</SelectItem>
                                     ))}
                                      {state.lists.length === 0 && <SelectItem value="no-lists" disabled>No lists available</SelectItem>}
                                 </SelectGroup>
                             </SelectContent>
                         </Select>
                     </div>
                     {/* Time Period Preset */}
                     <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
                          <Select value={timePeriodPreset} onValueChange={(value: '7d' | '30d' | '90d' | 'custom') => setTimePeriodPreset(value)}>
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
                     {/* Date Range Picker */}
                      <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[240px]">
                          <DateRangePicker
                             range={dateRange}
                             onRangeChange={handleDateRangeChange}
                              triggerClassName="w-full justify-start text-left font-normal text-xs sm:text-sm glow-border-inner"
                              align="start"
                          />
                      </div>
                      {/* Category Filter */}
                       <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                          <Select value={selectedCategory} onValueChange={(value: string) => setSelectedCategory(value)}>
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
                 </CardContent>
             </Card>

             {/* Main Content Area (Scrollable) */}
             <div className="flex-grow overflow-y-auto mt-4">
                 <div className="space-y-4 sm:space-y-6 pb-6">
                     {/* Summary Cards */}
                     <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                         <Card className="bg-card border-primary/30 shadow-neon glow-border-inner">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                             <CardTitle className="text-xs sm:text-sm font-medium text-primary">Total Spent</CardTitle>
                             <WalletCards className="h-4 w-4 text-muted-foreground" />
                             </CardHeader>
                             <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5 glow-border-inner">
                             <div className="text-lg sm:text-2xl font-bold text-neonText">{formatCurrency(summaryStats.totalSpent)}</div>
                             <p className="text-xs text-muted-foreground">{summaryStats.totalItems} items ({getFilterLabel()})</p>
                             </CardContent>
                         </Card>
                         <Card className="bg-card border-secondary/30 shadow-neon glow-border-inner">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                             <CardTitle className="text-xs sm:text-sm font-medium text-secondary">Avg. Spend / Day</CardTitle>
                             <TrendingUp className="h-4 w-4 text-muted-foreground" />
                             </CardHeader>
                             <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5 glow-border-inner">
                             <div className="text-lg sm:text-2xl font-bold text-neonText">{formatCurrency(summaryStats.averagePerDayInRange)}</div>
                             <p className="text-xs text-muted-foreground">Avg/spending day: {formatCurrency(summaryStats.averagePerSpendingDay)}</p>
                             </CardContent>
                         </Card>
                         <Card className="bg-card border-yellow-500/30 shadow-neon glow-border-inner">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                             <CardTitle className="text-xs sm:text-sm font-medium text-yellow-500">Highest Spend Day</CardTitle>
                             <CalendarDays className="h-4 w-4 text-muted-foreground" />
                             </CardHeader>
                             <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5 glow-border-inner">
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
                             <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5 glow-border-inner">
                             <div className="text-lg sm:text-2xl font-bold text-neonText">{summaryStats.totalItems}</div>
                                 <p className="text-xs text-muted-foreground">{getFilterLabel()}</p>
                             </CardContent>
                         </Card>
                     </div>

                     {/* Charts */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                         <Card className="bg-card border-primary/30 shadow-neon lg:col-span-1 glow-border-inner">
                             <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                                 <div>
                                     <CardTitle className="text-base sm:text-lg text-primary">Expense Trend</CardTitle>
                                     <CardDescription className="text-xs text-muted-foreground mt-1">{getFilterLabel()}</CardDescription>
                                 </div>
                                 <div className="flex items-center gap-1 border border-border/30 p-1 rounded-md self-start sm:self-center glow-border-inner">
                                     <Button
                                         variant={trendChartType === 'line' ? 'secondary' : 'ghost'}
                                         size="icon"
                                         onClick={() => setTrendChartType('line')}
                                         className={`h-7 w-7 ${trendChartType === 'line' ? 'bg-secondary/50 text-secondary-foreground shadow-sm' : 'text-muted-foreground'} glow-border-inner`}
                                         aria-label="Show as Line Chart"
                                     > <BarChart3 className="h-4 w-4 transform rotate-90" /> </Button>
                                     <Button
                                         variant={trendChartType === 'bar' ? 'secondary' : 'ghost'}
                                         size="icon"
                                         onClick={() => setTrendChartType('bar')}
                                         className={`h-7 w-7 ${trendChartType === 'bar' ? 'bg-secondary/50 text-secondary-foreground shadow-sm' : 'text-muted-foreground'} glow-border-inner`}
                                         aria-label="Show as Bar Chart"
                                     > <BarChart3 className="h-4 w-4" /> </Button>
                                 </div>
                             </CardHeader>
                             <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4 glow-border-inner">
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
                                 <div className="flex items-center gap-1 border border-border/30 p-1 rounded-md self-start sm:self-center glow-border-inner">
                                     <Button
                                             variant={categoryChartType === 'pie' ? 'primary' : 'ghost'}
                                             size="icon"
                                             onClick={() => setCategoryChartType('pie')}
                                             className={`h-7 w-7 ${categoryChartType === 'pie' ? 'bg-primary/50 text-primary-foreground shadow-sm' : 'text-muted-foreground'} glow-border-inner`}
                                             aria-label="Show as Pie Chart"
                                         > <PieChartIcon className="h-4 w-4" /> </Button>
                                         <Button
                                             variant={categoryChartType === 'bar' ? 'primary' : 'ghost'}
                                             size="icon"
                                             onClick={() => setCategoryChartType('bar')}
                                             className={`h-7 w-7 ${categoryChartType === 'bar' ? 'bg-primary/50 text-primary-foreground shadow-sm' : 'text-muted-foreground'} glow-border-inner`}
                                             aria-label="Show as Bar Chart"
                                         > <BarChart3 className="h-4 w-4" /> </Button>
                                     </div>
                             </CardHeader>
                             <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4 glow-border-inner">
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
         {/* Header Skeleton */}
         <div className="flex justify-between items-center">
             <Skeleton className="h-7 w-2/5 sm:h-8 sm:w-1/3" />
             <div className="flex gap-2">
                 <Skeleton className="h-8 w-16 rounded-md" />
                 <Skeleton className="h-8 w-16 rounded-md" />
             </div>
         </div>

        {/* Filter Section Skeleton */}
        <Card className="bg-card/80 border-border/20 shadow-sm sticky top-0 z-10 glow-border">
            <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                 <Skeleton className="h-5 w-1/4 mb-2 sm:mb-0" /> {/* Title */}
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-2">
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md glow-border-inner" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[160px] rounded-md glow-border-inner" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[240px] rounded-md glow-border-inner" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md glow-border-inner" />
            </CardContent>
        </Card>

        {/* Main Content Area Skeleton */}
         <div className="flex-grow overflow-y-auto mt-4">
            <div className="space-y-4 sm:space-y-6 pb-6">
                {/* Summary Cards Skeleton */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="bg-card border-border/20 shadow-md glow-border-inner">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                                <Skeleton className="h-4 w-3/5" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5 glow-border-inner">
                                <Skeleton className="h-6 w-1/2 sm:h-7 mb-1" />
                                <Skeleton className="h-3 w-3/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <Card className="bg-card border-border/20 shadow-md lg:col-span-1 glow-border-inner">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                            <div className="w-3/5 space-y-1">
                                <Skeleton className="h-5 sm:h-6 w-4/5" />
                                <Skeleton className="h-4 w-3/5" />
                            </div>
                            <Skeleton className="h-8 w-16 rounded-md glow-border-inner" />
                        </CardHeader>
                        <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4 h-[248px] sm:h-[348px] flex items-center justify-center glow-border-inner">
                            <Skeleton className="h-4/5 w-11/12" />
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border/20 shadow-md lg:col-span-1 glow-border-inner">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                            <div className="w-3/5 space-y-1">
                                <Skeleton className="h-5 sm:h-6 w-full" />
                                <Skeleton className="h-4 w-3/5" />
                            </div>
                            <Skeleton className="h-8 w-16 rounded-md glow-border-inner" />
                        </CardHeader>
                        <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4 h-[248px] sm:h-[348px] flex items-center justify-center glow-border-inner">
                            <Skeleton className="h-4/5 w-4/5 rounded-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
         </div>
    </div>
);
