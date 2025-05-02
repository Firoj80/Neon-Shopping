
"use client";
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell, // Import Cell for category bar chart coloring
} from 'recharts';
import { useAppContext } from '@/context/app-context';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { itemCategories } from '@/config/categories'; // Import categories for coloring

interface ExpenseChartProps {
  data: ProcessedExpenseData[];
  chartType: 'line' | 'bar';
  keyPrefix?: string; // Optional prefix for gradient IDs if used multiple times
}

export interface ProcessedExpenseData {
    date: string; // Formatted date string OR category name
    total: number;
    [category: string]: number | string; // Allow dynamic keys for category data
}

const chartConfig = {
  total: {
    label: "Total Spend",
    color: "hsl(var(--primary))", // Neon Cyan
  },
  // Define colors for categories
  Grocery: { label: "Grocery", color: "hsl(var(--chart-1))" },
  Electronics: { label: "Electronics", color: "hsl(var(--chart-2))" },
  Home: { label: "Home", color: "hsl(var(--chart-3))" },
  Beauty: { label: "Beauty", color: "hsl(var(--chart-4))" },
  Health: { label: "Health", color: "hsl(var(--chart-5))" },
  Fitness: { label: "Fitness", color: "hsl(150 100% 50%)" }, // Example Neon Green
  Sports: { label: "Sports", color: "hsl(270 100% 60%)" }, // Example Neon Purple
  Clothing: { label: "Clothing", color: "hsl(30 100% 50%)" }, // Example Neon Orange
  Books: { label: "Books", color: "hsl(210 100% 60%)" }, // Example Neon Blue
  Gifts: { label: "Gifts", color: "hsl(330 100% 60%)" }, // Example Neon Pink
  Other: { label: "Other", color: "hsl(0 0% 70%)" }, // Grey
} satisfies ChartConfig;


export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, chartType, keyPrefix = "trend" }) => {
  const { formatCurrency } = useAppContext();
  const gradientId = `${keyPrefix}NeonGradientBar`; // Unique gradient ID

   const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border/50 bg-background p-2 text-xs shadow-md backdrop-blur-sm">
           <p className="font-medium text-primary">{`${label}`}</p>
           {payload.map((pld: any, index: number) => (
             <p key={index} style={{ color: pld.payload.fill || pld.color || chartConfig[pld.dataKey as keyof typeof chartConfig]?.color }}>
              {`${chartConfig[pld.dataKey as keyof typeof chartConfig]?.label || pld.name}: ${formatCurrency(pld.value)}`}
             </p>
           ))}
        </div>
      );
    }
    return null;
  };

  const isCategoryChart = keyPrefix === 'category'; // Check if it's rendering categories

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
          <XAxis
            dataKey="date" // Assumes 'date' key for trend chart
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={data.length > 10 ? Math.floor(data.length / 10) : 0} // Reduce ticks for many points
            angle={data.length > 15 ? -30 : 0}
            dy={data.length > 15 ? 10 : 0}
          />
          <YAxis
             stroke="hsl(var(--muted-foreground))"
             fontSize={10}
             tickLine={false}
             axisLine={false}
             tickFormatter={(value) => formatCurrency(value).replace(/(\.00$)/, '')}
             width={45} // Increased width slightly
             allowDecimals={false}
          />
          <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                wrapperClassName="!bg-card/80 backdrop-blur-sm !border-primary/50"
           />
          <Line
            type="monotone"
            dataKey="total"
            name="Total Spend"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 1 }}
            activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
          />
        </LineChart>
      );
    } else { // Bar Chart
      return (
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" vertical={false}/>
           <XAxis
            dataKey="date" // 'date' key holds category name for category bar chart
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={0} // Show all category labels
            angle={data.length > 8 ? -45 : 0} // Angle labels if many categories
            dy={data.length > 8 ? 10 : 0}
            height={data.length > 8 ? 40 : 20} // Adjust height for angled labels
          />
          <YAxis
             stroke="hsl(var(--muted-foreground))"
             fontSize={10}
             tickLine={false}
             axisLine={false}
             tickFormatter={(value) => formatCurrency(value).replace(/(\.00$)/, '')}
             width={45}
             allowDecimals={false}
          />
           <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--primary)/0.1)' }}
                wrapperClassName="!bg-card/80 backdrop-blur-sm !border-primary/50"
            />
           <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.6}/>
                </linearGradient>
            </defs>
           <Bar
            dataKey="total"
            name="Total Spend"
            // fill is handled by Cell if it's a category chart
            // fill={isCategoryChart ? undefined : `url(#${gradientId})`} // Use gradient only for trend
            radius={[4, 4, 0, 0]}
             maxBarSize={30}
            >
             {/* Apply individual cell colors only for category bar chart */}
             {isCategoryChart && data.map((entry, index) => {
                 const category = entry.date; // Category name is in the 'date' field for this setup
                 const color = chartConfig[category as keyof typeof chartConfig]?.color || chartConfig.Other.color;
                 return <Cell key={`cell-${index}`} fill={color} />;
             })}
             {/* Apply gradient fill only for trend bar chart */}
             {!isCategoryChart && <Cell fill={`url(#${gradientId})`} />}
            </Bar>
        </BarChart>
      );
    }
  };

  return (
     <ChartContainer config={chartConfig} className="aspect-video h-[250px] sm:h-[300px] w-full">
         <ResponsiveContainer width="100%" height="100%">
             {renderChart()}
         </ResponsiveContainer>
     </ChartContainer>
  );
};
