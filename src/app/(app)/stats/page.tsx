"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExpenseChart } from '@/components/charts/expense-chart';
import type { ProcessedExpenseData } from '@/components/charts/expense-chart';
import { useAppContext } from '@/context/app-context';
import { subDays, format, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, WalletCards, CalendarDays } from 'lucide-react';


type ChartType = 'line' | 'bar';
type TimePeriod = '7d' | '30d' | '90d';

export default function StatsPage() {
    const { state, formatCurrency, isLoading } = useAppContext();
    const [chartType, setChartType] = useState<ChartType>('line');
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');

    const processedData = useMemo(() => {
        const now = new Date();
        const daysToSubtract = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90;
        const startDate = startOfDay(subDays(now, daysToSubtract - 1)); // Include today
        const endDate = endOfDay(now);

        const relevantItems = state.shoppingList.filter(item =>
            isWithinInterval(new Date(item.dateAdded), { start: startDate, end: endDate })
        );

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

    }, [state.shoppingList, timePeriod]);


     const summaryStats = useMemo(() => {
        const totalSpent = processedData.reduce((sum, day) => sum + day.total, 0);
        const numberOfDays = processedData.length || 1; // Avoid division by zero
        const averagePerDay = totalSpent / numberOfDays;
        const highestSpendDay = processedData.reduce((max, day) => day.total > max.total ? day : max, { date: '', total: -1 });

        return {
            totalSpent,
            averagePerDay,
            highestSpendDay: highestSpendDay.total >= 0 ? highestSpendDay : null,
        };
    }, [processedData]);


    if (isLoading) {
        return <StatsPageSkeleton />;
    }


    return (
        <div className="space-y-6">
        <h1 className="text-2xl font-bold text-primary">Expense Dashboard</h1>

        {/* Summary Cards */}
         <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card border-primary/30 shadow-neon">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Total Spent ({timePeriod})</CardTitle>
                <WalletCards className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-neonText">{formatCurrency(summaryStats.totalSpent)}</div>
                </CardContent>
            </Card>
             <Card className="bg-card border-secondary/30 shadow-neon">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-secondary">Average Spend / Day</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-neonText">{formatCurrency(summaryStats.averagePerDay)}</div>
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
         </div>

        {/* Chart Section */}
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
                 <Button
                    variant={chartType === 'line' ? 'default' : 'outline'}
                    onClick={() => setChartType('line')}
                    className={`shadow-neon ${chartType === 'line' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
                >
                    Line Chart
                </Button>
                <Button
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    onClick={() => setChartType('bar')}
                    className={`shadow-neon ${chartType === 'bar' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
                >
                    Bar Chart
                </Button>
                 {/* Add Category Bar Chart Toggle if implemented */}
            </div>

             <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                <SelectTrigger className="w-[180px] border-secondary/50 focus:border-secondary focus:shadow-secondary focus:ring-secondary [&[data-state=open]]:border-primary [&[data-state=open]]:shadow-primary">
                    <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent className="bg-card border-secondary/80 text-neonText">
                    <SelectItem value="7d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary">Last 7 Days</SelectItem>
                    <SelectItem value="30d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary">Last 30 Days</SelectItem>
                    <SelectItem value="90d" className="focus:bg-primary/30 focus:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-secondary">Last 90 Days</SelectItem>
                </SelectContent>
            </Select>
            </div>

             {processedData.length > 0 ? (
                <ExpenseChart data={processedData} chartType={chartType} timePeriod={timePeriod} />
             ) : (
                 <Card className="bg-card border-primary/30 shadow-neon flex items-center justify-center h-[300px]">
                     <p className="text-muted-foreground">No expense data available for the selected period.</p>
                 </Card>
             )}

        </div>
        </div>
    );
}


const StatsPageSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-1/4" /> {/* Title */}

        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card border-border/20 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-2/5" />
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
        <div className="space-y-4">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                </div>
                <Skeleton className="h-10 w-[180px] rounded-md" />
             </div>
             <Card className="bg-card border-border/20 shadow-md h-[348px] flex items-center justify-center">
                 <Skeleton className="h-4/5 w-11/12" />
             </Card>
        </div>
    </div>
);
