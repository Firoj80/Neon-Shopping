"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { ExpenseChart } from '@/components/charts/expense-chart'; // Keep for line/bar
import type { ProcessedExpenseData } from '@/components/charts/expense-chart';
import { CategoryPieChart } from '@/components/charts/category-pie-chart'; // Import new Pie Chart
import type { CategoryData } from '@/components/charts/category-pie-chart'; // Import type for Pie Chart data
import { useAppContext } from '@/context/app-context';
import { subDays, format, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, WalletCards, CalendarDays, Filter, Layers, PieChart as PieChartIcon } from 'lucide-react'; // Added PieChartIcon
import { ScrollArea } from '@/components/ui/scroll-area';
import { itemCategories } from '@/config/categories';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

type ChartType = 'line' | 'bar';
type TimePeriodPreset = '7d' | '30d' | '90d' | 'custom';
type CategoryFilter = string; // 'all' or specific category name

export default function StatsPage() {
    const { state, formatCurrency, isLoading } = useAppContext();
    const [chartType, setChartType] = useState<ChartType>('line');
    const [timePeriodPreset, setTimePeriodPreset] = useState<TimePeriodPreset>('30d');
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, 29));
        return { from: startDate, to: endDate };
    });

    // Update date range when preset changes
    useEffect(() => {
        if (timePeriodPreset === 'custom' || !dateRange) return;

        const now = new Date();
        let startDate: Date;
        const endDate = endOfDay(now);

        switch (timePeriodPreset) {
            case '7d': startDate = startOfDay(subDays(now, 6)); break;
            case '90d': startDate = startOfDay(subDays(now, 89)); break;
            case '30d': default: startDate = startOfDay(subDays(now, 29)); break;
        }
        setDateRange({ from: startDate, to: endDate });
    }, [timePeriodPreset]); // Removed dateRange from dependencies to avoid loop

    // Handler for DateRangePicker changes
    const handleDateRangeChange = (newRange: DateRange | undefined) => {
        setDateRange(newRange);
        if (newRange?.from && newRange?.to) {
           setTimePeriodPreset('custom');
        }
    };

     // Filter items based on current date range and category filter
     const filteredItems = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return [];

        const startDate = startOfDay(dateRange.from);
        const endDate = endOfDay(dateRange.to);

        return state.shoppingList.filter(item => {
            // Filter only *checked* (purchased) items for expense analysis
            if (!item.checked) return false;

            const itemDate = new Date(item.dateAdded);
            const isWithinDate = isWithinInterval(itemDate, { start: startDate, end: endDate });
            const isMatchingCategory = selectedCategory === 'all' || item.category === selectedCategory;
            return isWithinDate && isMatchingCategory;
        });
    }, [state.shoppingList, dateRange, selectedCategory]);


    // Process data for Line/Bar chart (Expense Trend)
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
             date: format(dateMap.get(dateStr)!, dateFormat), // Format using original Date object
             total,
           }))
          .sort((a, b) => {
              // Find original date strings for sorting comparison
              const dateAStr = [...dateMap.entries()].find(([_, d]) => format(d, dateFormat) === a.date)?.[0];
              const dateBStr = [...dateMap.entries()].find(([_, d]) => format(d, dateFormat) === b.date)?.[0];
              if (!dateAStr || !dateBStr) return 0; // Should not happen
              return dateMap.get(dateAStr)!.getTime() - dateMap.get(dateBStr)!.getTime();
          });

        return formattedData;

    }, [filteredItems, dateRange]); // Depend on filteredItems and dateRange

     // Process data for Pie Chart (Category Breakdown)
     const processedCategoryData = useMemo(() => {
         const categoryTotals: Record<string, number> = {};

         filteredItems.forEach(item => {
             if (!categoryTotals[item.category]) {
                 categoryTotals[item.category] = 0;
             }
             categoryTotals[item.category] += item.quantity * item.price;
         });

         // Calculate total for percentage calculation
         const totalSpent = Object.values(categoryTotals).reduce((sum, total) => sum + total, 0);
         if (totalSpent === 0) return []; // Avoid division by zero

         const categoryData: CategoryData[] = Object.entries(categoryTotals)
             .map(([category, total]) => ({
                 category,
                 total,
                 // fill is handled by the chart component using config
             }))
             .sort((a, b) => b.total - a.total); // Sort by total descending

         return categoryData;
     }, [filteredItems]); // Depend on filteredItems


     const summaryStats = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return { totalSpent: 0, averagePerDayInRange: 0, averagePerSpendingDay: 0, highestSpendDay: null, totalItems: 0 };

        const totalSpent = filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const daysWithSpending = new Set(filteredItems.map(item => format(new Date(item.dateAdded), 'yyyy-MM-dd')));
        const numberOfDaysWithSpending = Math.max(1, daysWithSpending.size); // Ensure at least 1 to avoid division by zero

         // Use processedTrendData for daily calculations to include zero-spend days within the range
         const numberOfDaysInRange = Math.max(1, processedTrendData.length);
         const averagePerDayInRange = totalSpent / numberOfDaysInRange;
         const averagePerSpendingDay = totalSpent / numberOfDaysWithSpending;

         // Find highest spending day from processedTrendData
         const highestSpendDay = processedTrendData.reduce((max, day) => (day.total > max.total ? day : max), { date: '', total: -1 });

         const totalItems = filteredItems.length; // Total purchased items in filters

        return {
            totalSpent,
            averagePerDayInRange,
            averagePerSpendingDay,
            highestSpendDay: highestSpendDay.total >= 0 ? highestSpendDay : null,
            totalItems,
        };
    }, [filteredItems, processedTrendData, dateRange]); // Depend on filteredItems and processedTrendData

    if (isLoading) {
        return <StatsPageSkeleton />;
    }

    const getFilterLabel = () => {
        let dateLabel = '';
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

        const categoryLabel = selectedCategory === 'all' ? '' : ` (${selectedCategory})`;
        return `${dateLabel}${categoryLabel}`;
    };


    return (
         // Use flex-col and gap for overall page structure
        <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Expense Dashboard</h1>

            {/* Filter Section */}
             <Card className="bg-card/80 border-border/20 shadow-sm">
                <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                    <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filters
                    </CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6">
                    {/* Time Period Preset */}
                    <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
                         <Select value={timePeriodPreset} onValueChange={(value: TimePeriodPreset) => setTimePeriodPreset(value)}>
                             <SelectTrigger className="w-full border-secondary/50 focus:border-secondary focus:shadow-secondary focus:ring-secondary [&[data-state=open]]:border-primary [&[data-state=open]]:shadow-primary text-xs sm:text-sm">
                                <CalendarDays className="h-4 w-4 mr-2 opacity-70" />
                                <SelectValue placeholder="Select time period" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-secondary/80 text-neonText">
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
                             triggerClassName="w-full justify-start text-left font-normal text-xs sm:text-sm"
                             align="start"
                         />
                     </div>
                     {/* Category Selector */}
                      <div className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                         <Select value={selectedCategory} onValueChange={(value: CategoryFilter) => setSelectedCategory(value)}>
                             <SelectTrigger className="w-full border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[state=open]]:border-secondary [&[state=open]]:shadow-secondary text-xs sm:text-sm">
                                 <Layers className="h-4 w-4 mr-2 opacity-70" />
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                             <SelectContent
                                className="bg-card border-primary/80 text-neonText max-h-60 overflow-y-auto"
                                position="popper"
                             >
                                 <ScrollArea className="h-full">
                                    <SelectGroup>
                                        <SelectLabel className="text-muted-foreground/80 px-2 text-xs">Filter by Category</SelectLabel>
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
                </CardContent>
            </Card>


            {/* Summary Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                 {/* Total Spent */}
                <Card className="bg-card border-primary/30 shadow-neon">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                    <CardTitle className="text-xs sm:text-sm font-medium text-primary">Total Spent</CardTitle>
                    <WalletCards className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                     <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5">
                    <div className="text-lg sm:text-2xl font-bold text-neonText">{formatCurrency(summaryStats.totalSpent)}</div>
                      <p className="text-xs text-muted-foreground">{summaryStats.totalItems} items ({getFilterLabel()})</p>
                    </CardContent>
                </Card>
                 {/* Avg Spend / Day */}
                 <Card className="bg-card border-secondary/30 shadow-neon">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4 sm:pb-2 sm:pt-4 sm:px-5">
                    <CardTitle className="text-xs sm:text-sm font-medium text-secondary">Avg. Spend / Day</CardTitle>
                     <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                     <CardContent className="pb-3 px-4 sm:pb-4 sm:px-5">
                    <div className="text-lg sm:text-2xl font-bold text-neonText">{formatCurrency(summaryStats.averagePerDayInRange)}</div>
                     <p className="text-xs text-muted-foreground">Avg/spending day: {formatCurrency(summaryStats.averagePerSpendingDay)}</p>
                    </CardContent>
                </Card>
                 {/* Highest Spend Day */}
                 <Card className="bg-card border-yellow-500/30 shadow-neon">
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
                 {/* Items Purchased */}
                 <Card className="bg-card border-green-500/30 shadow-neon">
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

            {/* Chart Section - Use Grid for side-by-side charts on larger screens */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                 {/* Expense Trend Chart */}
                 <Card className="bg-card border-primary/30 shadow-neon lg:col-span-1">
                     <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                         <div>
                             <CardTitle className="text-base sm:text-lg text-primary">Expense Trend</CardTitle>
                             <CardDescription className="text-xs text-muted-foreground mt-1">{getFilterLabel()}</CardDescription>
                         </div>
                        <div className="flex items-center gap-1 border border-border/30 p-1 rounded-md self-start sm:self-center">
                             <Button
                                variant={chartType === 'line' ? 'secondary' : 'ghost'}
                                 size="sm"
                                onClick={() => setChartType('line')}
                                className={`h-7 px-2 text-xs ${chartType === 'line' ? 'bg-secondary/50 text-secondary-foreground shadow-sm' : 'text-muted-foreground'}`}
                            > Line </Button>
                            <Button
                                variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                                 size="sm"
                                onClick={() => setChartType('bar')}
                                className={`h-7 px-2 text-xs ${chartType === 'bar' ? 'bg-secondary/50 text-secondary-foreground shadow-sm' : 'text-muted-foreground'}`}
                            > Bar </Button>
                        </div>
                     </CardHeader>
                     <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4">
                        {processedTrendData.length > 0 ? (
                            <ExpenseChart data={processedTrendData} chartType={chartType} />
                        ) : (
                            <div className="flex items-center justify-center h-[200px] sm:h-[300px]">
                                <p className="text-muted-foreground text-center text-sm">No expense data available for the selected filters.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 {/* Category Breakdown Chart */}
                 <Card className="bg-card border-secondary/30 shadow-neon lg:col-span-1">
                     <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-4">
                         <CardTitle className="text-base sm:text-lg text-secondary flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" /> Category Breakdown
                         </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground mt-1">{getFilterLabel()}</CardDescription>
                     </CardHeader>
                     <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4">
                         {processedCategoryData.length > 0 ? (
                            <CategoryPieChart data={processedCategoryData} />
                         ) : (
                             <div className="flex items-center justify-center h-[200px] sm:h-[300px]">
                                 <p className="text-muted-foreground text-center text-sm">No spending by category for the selected filters.</p>
                             </div>
                         )}
                     </CardContent>
                 </Card>
            </div>

        </div>
    );
}


const StatsPageSkeleton: React.FC = () => (
    <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-0 animate-pulse">
        <Skeleton className="h-7 w-2/5 sm:h-8 sm:w-1/3" /> {/* Title */}

        {/* Filter Skeleton */}
        <Card className="bg-card/80 border-border/20 shadow-sm">
            <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-5">
                <Skeleton className="h-5 w-1/5" />
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 sm:p-6">
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[160px] rounded-md" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[240px] rounded-md" />
                 <Skeleton className="h-9 sm:h-10 flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[180px] rounded-md" />
            </CardContent>
        </Card>


        {/* Summary Cards Skeleton */}
         <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-border/20 shadow-md">
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

         {/* Chart Section Skeleton */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
             {/* Trend Chart Skeleton */}
            <Card className="bg-card border-border/20 shadow-md lg:col-span-1">
                 <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 sm:p-5 pb-3 sm:pb-4">
                     <Skeleton className="h-5 w-2/5 sm:h-6" />
                     <Skeleton className="h-8 w-20 rounded-md" />
                 </CardHeader>
                 <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4 h-[248px] sm:h-[348px] flex items-center justify-center">
                     <Skeleton className="h-4/5 w-11/12" />
                 </CardContent>
            </Card>
             {/* Pie Chart Skeleton */}
             <Card className="bg-card border-border/20 shadow-md lg:col-span-1">
                 <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-4">
                     <Skeleton className="h-5 w-3/5 sm:h-6 mb-1" />
                     <Skeleton className="h-4 w-1/2" />
                 </CardHeader>
                 <CardContent className="pl-1 pr-3 sm:pl-2 sm:pr-4 pb-4 h-[248px] sm:h-[348px] flex items-center justify-center">
                     <Skeleton className="h-4/5 w-4/5 rounded-full" />
                 </CardContent>
             </Card>
         </div>
    </div>
);

