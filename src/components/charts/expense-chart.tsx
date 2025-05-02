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
} from 'recharts';
import { useAppContext } from '@/context/app-context';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ExpenseChartProps {
  data: ProcessedExpenseData[];
  chartType: 'line' | 'bar';
  // timePeriod prop removed, as filtering is done before passing data
}

export interface ProcessedExpenseData {
    date: string; // Formatted date string (e.g., 'MMM dd', 'yyyy-MM-dd')
    total: number;
    [category: string]: number | string;
}

const chartConfig = {
  total: {
    label: "Total Spend",
    color: "hsl(var(--primary))", // Neon Cyan
  },
  // Define colors for categories if doing category bar chart
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


export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, chartType }) => {
  const { formatCurrency } = useAppContext();

   const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload; // Assuming single data key 'total' or similar
      return (
        <div className="rounded-lg border border-border/50 bg-background p-2 text-xs shadow-md backdrop-blur-sm">
           <p className="font-medium text-primary">{`${label}`}</p>
           {/* Iterate through payload for potential multiple bars/lines */}
           {payload.map((pld: any, index: number) => (
             <p key={index} style={{ color: pld.color || chartConfig[pld.dataKey as keyof typeof chartConfig]?.color }}>
              {`${chartConfig[pld.dataKey as keyof typeof chartConfig]?.label || pld.name}: ${formatCurrency(pld.value)}`}
             </p>
           ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
             // Angle ticks if many data points to prevent overlap
             // angle={data.length > 15 ? -30 : 0}
             // dy={data.length > 15 ? 10 : 0}
             // interval="preserveStartEnd" // Ensure first and last ticks are shown
          />
          <YAxis
             stroke="hsl(var(--muted-foreground))"
             fontSize={10}
             tickLine={false}
             axisLine={false}
             tickFormatter={(value) => formatCurrency(value).replace(/(\.00$)/, '')} // Remove trailing .00
             width={40} // Add width to prevent Y-axis label overlap
             allowDecimals={false}
          />
          <Tooltip content={<ChartTooltipContent indicator="line" hideLabel />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} wrapperClassName="!bg-card/80 backdrop-blur-sm !border-primary/50" />
          <Line
            type="monotone"
            dataKey="total"
            name="Total Spend" // Add name for tooltip reference
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
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            // angle={data.length > 15 ? -30 : 0}
            // dy={data.length > 15 ? 10 : 0}
            // interval="preserveStartEnd"
          />
          <YAxis
             stroke="hsl(var(--muted-foreground))"
             fontSize={10}
             tickLine={false}
             axisLine={false}
             tickFormatter={(value) => formatCurrency(value).replace(/(\.00$)/, '')}
             width={40}
             allowDecimals={false}
          />
           <Tooltip content={<ChartTooltipContent indicator="dot" hideLabel />} cursor={{ fill: 'hsl(var(--primary)/0.1)' }} wrapperClassName="!bg-card/80 backdrop-blur-sm !border-primary/50" />
           <defs>
                <linearGradient id="neonGradientBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.6}/>
                </linearGradient>
            </defs>
           <Bar
            dataKey="total" // Or iterate through categories if needed
            name="Total Spend"
            fill="url(#neonGradientBar)" // Use gradient fill
            radius={[4, 4, 0, 0]} // Rounded tops
             maxBarSize={30} // Limit max bar size for better look
            />
        </BarChart>
      );
    }
  };

  return (
     // Use ChartContainer for responsiveness and config context
     <ChartContainer config={chartConfig} className="aspect-video h-[250px] sm:h-[300px] w-full">
         <ResponsiveContainer width="100%" height="100%">
             {renderChart()}
         </ResponsiveContainer>
     </ChartContainer>
  );
};
