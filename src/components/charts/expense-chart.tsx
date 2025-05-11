
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
  Cell,
} from 'recharts';
import { useAppContext } from '@/context/app-context';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ExpenseChartProps {
  data: ProcessedExpenseData[];
  chartType: 'line' | 'bar';
  keyPrefix?: string;
  chartConfig: ChartConfig; // Accept dynamic chart config
}

export interface ProcessedExpenseData {
    date: string; // Formatted date string OR category name
    total: number;
    [category: string]: number | string;
}

// Removed static chartConfig here, will use the prop instead

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, chartType, keyPrefix = "trend", chartConfig }) => {
  const { formatCurrency } = useAppContext();
  const gradientId = `${keyPrefix}NeonGradientBar`;

   const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Determine the correct key for the label based on chart type
        const labelKey = isCategoryChart ? label : label; // Category name is in 'label' for category chart

        // Look up config using the correct key (which might be category name or date)
        const configLabel = chartConfig[labelKey as keyof typeof chartConfig]?.label || labelKey;

      return (
        <div className="rounded-lg border border-border/50 bg-background p-2 text-xs shadow-md backdrop-blur-sm">
           <p className="font-medium text-primary">{`${configLabel}`}</p>
           {payload.map((pld: any, index: number) => {
              // Determine the key for the data series (usually 'total' or category name)
              const dataKey = pld.dataKey as keyof typeof chartConfig;
              const seriesLabel = chartConfig[dataKey]?.label || pld.name; // Get label from config or fallback to name
              const seriesColor = pld.payload.fill || pld.color || chartConfig[dataKey]?.color || 'hsl(var(--foreground))'; // Get color

              return (
                  <p key={index} style={{ color: seriesColor }}>
                    {`${seriesLabel}: ${formatCurrency(pld.value)}`}
                  </p>
              );
           })}
        </div>
      );
    }
    return null;
  };

  const isCategoryChart = keyPrefix === 'category';

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
            interval={data.length > 10 ? Math.floor(data.length / 10) : 0}
            angle={data.length > 15 ? -30 : 0}
            dy={data.length > 15 ? 10 : 0}
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
                content={<CustomTooltip />} // Use updated custom tooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                wrapperClassName="!bg-card/80 backdrop-blur-sm !border-primary/50"
           />
          <Line
            type="monotone"
            dataKey="total" // Assuming trend data always uses 'total'
            name={chartConfig.total.label as string || "Total Spend"} // Use label from config
            stroke={chartConfig.total.color || "hsl(var(--primary))"} // Use color from config
            strokeWidth={2}
            dot={{ r: 3, fill: chartConfig.total.color || "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 1 }}
            activeDot={{ r: 5, fill: chartConfig.total.color || "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
          />
        </LineChart>
      );
    } else { // Bar Chart
      return (
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" vertical={false}/>
           <XAxis
            dataKey="date" // Holds date or category name
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={data.length > 8 ? -45 : 0}
            dy={data.length > 8 ? 10 : 0}
            height={data.length > 8 ? 40 : 20}
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
                content={<CustomTooltip />} // Use updated custom tooltip
                cursor={{ fill: 'hsl(var(--primary)/0.1)' }}
                wrapperClassName="!bg-card/80 backdrop-blur-sm !border-primary/50"
            />
           <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartConfig.total.color || "hsl(var(--primary))"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartConfig.total.color || "hsl(var(--secondary))"} stopOpacity={0.6}/>
                </linearGradient>
            </defs>
           <Bar
            dataKey="total"
            name={chartConfig.total.label as string || "Total Spend"} // Use label from config
            radius={[4, 4, 0, 0]}
             maxBarSize={30}
            >
             {/* Apply individual cell colors only for category bar chart */}
             {isCategoryChart && data.map((entry, index) => {
                 const categoryName = entry.date; // Category name is in the 'date' field
                 const color = chartConfig[categoryName as keyof typeof chartConfig]?.color || chartConfig.Uncategorized.color; // Use dynamic config
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

    