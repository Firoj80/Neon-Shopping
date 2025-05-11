
"use client"
import React from "react"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useAppContext } from '@/context/app-context';

export interface CategoryData {
  category: string; // Category name
  total: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  chartConfig: ChartConfig; // Accept dynamic chart config
}

// Removed static chartConfig here, will use the prop instead

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, chartConfig }) => {
    const { formatCurrency } = useAppContext();

  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0)
  }, [data])

  return (
     <ChartContainer
        config={chartConfig} // Use the passed config
        className="mx-auto aspect-square h-[250px] sm:h-[300px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                    hideLabel
                     // Use category name for lookup in dynamic config
                    formatter={(value, name) => `${chartConfig[name as keyof typeof chartConfig]?.label || name}: ${formatCurrency(value as number)}`}
                    className="!bg-card/80 backdrop-blur-sm !border-secondary/50"
                 />}
            />
            <Pie
              data={data}
              dataKey="total"
              nameKey="category" // Use category name as the key
              innerRadius={60}
              outerRadius={80}
              strokeWidth={5}
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const percentage = (percent * 100).toFixed(0);

                   if (parseInt(percentage) < 5) return null;

                  return (
                  <text
                    x={x}
                    y={y}
                    fill="hsl(var(--foreground))"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-[10px] font-medium fill-foreground"
                  >
                    {`${percentage}%`}
                  </text>
                  );
              }}
            >
               {/* Define Cell colors based on category name using dynamic config */}
               {data.map((entry, index) => {
                   // Use category name for lookup, fallback to Uncategorized color
                   const color = chartConfig[entry.category as keyof typeof chartConfig]?.color || chartConfig.Uncategorized?.color || "hsl(var(--muted))";
                   return <Cell key={`cell-${index}`} fill={color} />;
               })}
            </Pie>
              <ChartLegend
                 content={<ChartLegendContent nameKey="category" className="text-xs flex-wrap justify-center" />} // Use category name
                 verticalAlign="bottom"
                 align="center"
                 wrapperStyle={{ paddingBottom: '0px', paddingTop: '10px' }}
                />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
  )
}

    