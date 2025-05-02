
"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { ExpenseChart } from '@/components/charts/expense-chart';
import type { ProcessedExpenseData } from '@/components/charts/expense-chart';
import { useAppContext } from '@/context/app-context';
import { subDays, format, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, WalletCards, CalendarDays, Filter, Layers } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea if categories list gets long
import { itemCategories } from '@/config/categories'; // Import categories

type ChartType = 'line' | 'bar';
type TimePeriod = '7d' | '30d' | '90d';
type CategoryFilter = string; // 'all' or specific category name

export default function StatsPage() {
    const { state, formatCurrency, isLoading } = useAppContext();
    const [chartType, setChartType] = useState<ChartType>('line');
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

    const processedData = useMemo(() => {
        const now = new Date();
        const daysToSubtract = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90;
        const startDate = startOfDay(subDays(now, daysToSubtract - 1)); // Include today
        const endDate = endOfDay(now);

        const relevantItems = state.shoppingList.filter(item => {
             const isWithinDate = isWithinInterval(new Date(item.dateAdded), { start: startDate, end: endDate });
             const isMatchingCategory = selectedCategory === 'all' || item.category === selectedCategory;
             return isWithinDate && isMatchingCategory;
        });

        const dailyTotals: Record<string, number> = {};
        const datesInRange = eachDayOfInterval({ start: startDate, end: endDate });

        // Initialize all dates in range with 0 total
        datesInRange.forEach(date => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            dailyTotals[formattedDate] = 0;
        });


        // Aggregate totals
        relevantItems.forEach(item => {
            const itemDate = format(new Date(item.dateAdded), 'yyyy-MM-dd');
             if (dailyTotals.hasOwnProperty(itemDate)) { // Check if date exists (it should due to prefill)
                dailyTotals[itemDate] += item.quantity * item.price;
             }
        });

        // Format for chart
        const formattedData: ProcessedExpenseData[] = Object.entries(dailyTotals)
          .map(([date, total]) => ({
             date: format(new Date(date), timePeriod === '7d' ? 'eee' : 'MMM dd'), // Short day for 7d, Month Day otherwise
             total,
           }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ensure chronological order

        return formattedData;

    }, [state.shoppingList, timePeriod, selectedCategory]);


     const summaryStats = useMemo(() => {
        const totalSpent = processedData.reduce((sum, day) => sum + day.total, 0);
        const numberOfDaysWithSpending = processedData.filter(day => day.total > 0).length || 1; // Count days with actual spending
        const numberOfDaysInRange = processedData.length || 1; // Avoid division by zero
        const averagePerDayInRange = totalSpent / numberOfDaysInRange;
        const averagePerSpendingDay = totalSpent / numberOfDaysWithSpending;
        const highestSpendDay = processedData.reduce((max, day) => day.total > max.total ? day : max, { date: '', total: -1 });
        const totalItems = state.shoppingList.filter(item => { // Filter summary stats by category too
            const isWithinDate = isWithinInterval(new Date(item.dateAdded), { start: startOfDay(subDays(new Date(), timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90 - 1)), end: endOfDay(new Date()) });
             const isMatchingCategory = selectedCategory === 'all' || item.category === selectedCategory;
             return isWithinDate && isMatchingCategory;
        }).length;


        return {
            totalSpent,
            averagePerDayInRange,
            averagePerSpendingDay,
            highestSpendDay: highestSpendDay.total >= 0 ? highestSpendDay : null,
            totalItems,
        };
    }, [processedData, state.shoppingList, timePeriod, selectedCategory]);


    if (isLoading) {
        return <StatsPageSkeleton />;
    }

    const filterLabel = selectedCategory === 'all' ? `(${timePeriod})` : `(${selectedCategory} - ${timePeriod})`;


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-primary">Expense Dashboard</h1>

            {/* Filter Section */}
             <Card className="bg-card/80 border-border/20 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-secondary flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                         <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                            <SelectTrigger className="w-full sm:w-[180px] border-secondary/50 focus:border-secondary focus:shadow-secondary focus:ring-secondary [&[data-state=open]]:border-primary [&[data-state=open]]:shadow-primary">
                                <CalendarDays className="h-4 w-4 mr-2 opacity-70" />
                                <SelectValue placeholder="Select time period" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-secondary/80 text-neonText">
                                <SelectItem value="7d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary">Last 7 Days</SelectItem>
                                <SelectItem value="30d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary">Last 30 Days</SelectItem>
                                <SelectItem value="90d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary">Last 90 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex-1">
                         <Select value={selectedCategory} onValueChange={(value: CategoryFilter) => setSelectedCategory(value)}>
                            <SelectTrigger className="w-full sm:w-[220px] border-primary/50 focus:border-primary focus:shadow-neon focus:ring-primary [&[data-state=open]]:border-secondary [&[data-state=open]]:shadow-secondary">
                                 <Layers className="h-4 w-4 mr-2 opacity-70" />
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-primary/80 text-neonText max-h-60 overflow-y-auto">
                                {/* <ScrollArea className="h-[200px]"> */}
                                <SelectGroup>
                                    <SelectLabel className="text-muted-foreground/80">Filter by Category</SelectLabel>
                                    <SelectItem value="all" className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary">All Categories</SelectItem>
                                    {itemCategories.map((category) => (
                                        <SelectItem key={category} value={category} className="focus:bg-secondary/30 focus:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary">
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                                {/* </ScrollArea> */}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>


            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Card className="bg-card border-primary/30 shadow-neon">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Total Spent {filterLabel}</CardTitle>
                    <WalletCards className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold text-neonText">{formatCurrency(summaryStats.totalSpent)}</div>
                      <p className="text-xs text-muted-foreground">{summaryStats.totalItems} items</p>
                    </CardContent>
                </Card>
                 <Card className="bg-card border-secondary/30 shadow-neon">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-secondary">Avg. Spend / Day</CardTitle>
                     <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold text-neonText">{formatCurrency(summaryStats.averagePerDayInRange)}</div>
                     <p className="text-xs text-muted-foreground">Avg per spending day: {formatCurrency(summaryStats.averagePerSpendingDay)}</p>
                    </CardContent>
                </Card>
                 <Card className="bg-card border-yellow-500/30 shadow-neon">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-500">Highest Spend Day</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    {summaryStats.highestSpendDay ? (
                        <>
                            <div className="text-2xl font-bold text-neonText">{formatCurrency(summaryStats.highestSpendDay.total)}</div>
                            <p className="text-xs text-muted-foreground">on {summaryStats.highestSpendDay.date}</p>
                        </>
                    ) : (
                        <div className="text-lg font-bold text-muted-foreground">-</div>
                    )}
                    </CardContent>
                </Card>
                {/* Add a fourth summary card if needed, e.g., Most Frequent Category */}
                 <Card className="bg-card border-green-500/30 shadow-neon">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-500">Items Purchased</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       <div className="text-2xl font-bold text-neonText">{summaryStats.totalItems}</div>
                        <p className="text-xs text-muted-foreground">{filterLabel}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            <Card className="bg-card border-primary/30 shadow-neon">
                 <CardHeader className="flex flex-row items-center justify-between pb-4">
                     <CardTitle className="text-lg text-primary">
                       Expense Trend {filterLabel}
                     </CardTitle>
                     {/* Chart Type Toggle */}
                    <div className="flex items-center gap-1 border border-border/30 p-1 rounded-md">
                         <Button
                            variant={chartType === 'line' ? 'secondary' : 'ghost'}
                             size="sm"
                            onClick={() => setChartType('line')}
                            className={`h-7 px-2 text-xs ${chartType === 'line' ? 'bg-secondary/50 text-secondary-foreground shadow-sm' : 'text-muted-foreground'}`}
                        >
                            Line
                        </Button>
                        <Button
                            variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                             size="sm"
                            onClick={() => setChartType('bar')}
                            className={`h-7 px-2 text-xs ${chartType === 'bar' ? 'bg-secondary/50 text-secondary-foreground shadow-sm' : 'text-muted-foreground'}`}
                        >
                            Bar
                        </Button>
                    </div>
                 </CardHeader>
                 <CardContent className="pl-2">
                    {processedData.length > 0 ? (
                        <ExpenseChart data={processedData} chartType={chartType} timePeriod={timePeriod} />
                    ) : (
                        <div className="flex items-center justify-center h-[300px]">
                            <p className="text-muted-foreground">No expense data available for the selected filters.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


const StatsPageSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-1/3" /> {/* Title */}

        {/* Filter Skeleton */}
        <Card className="bg-card/80 border-border/20 shadow-sm">
            <CardHeader className="pb-3">
                <Skeleton className="h-5 w-1/5" />
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                 <Skeleton className="h-10 w-full sm:w-[180px] rounded-md" />
                 <Skeleton className="h-10 w-full sm:w-[220px] rounded-md" />
            </CardContent>
        </Card>


        {/* Summary Cards Skeleton */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-border/20 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-7 w-1/2 mb-1" />
                        <Skeleton className="h-3 w-3/4" />
                    </CardContent>
                </Card>
            ))}
        </div>

         {/* Chart Section Skeleton */}
        <Card className="bg-card border-border/20 shadow-md">
             <CardHeader className="flex flex-row items-center justify-between pb-4">
                 <Skeleton className="h-6 w-2/5" />
                 <Skeleton className="h-8 w-20 rounded-md" />
             </CardHeader>
             <CardContent className="pl-2 h-[348px] flex items-center justify-center">
                 <Skeleton className="h-4/5 w-11/12" />
             </CardContent>
        </Card>
    </div>
);
