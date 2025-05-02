"use client"
import React from "react"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  category: string;
  total: number;
  // fill: string; // Let the chart component handle the fill based on config
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

// Define chart config mapping categories to colors (reuse/extend from expense-chart if possible)
const chartConfig = {
  total: { label: "Total" }, // Default label if needed
  Grocery: { label: "Grocery", color: "hsl(var(--chart-1))" },
  Electronics: { label: "Electronics", color: "hsl(var(--chart-2))" },
  Home: { label: "Home", color: "hsl(var(--chart-3))" },
  Beauty: { label: "Beauty", color: "hsl(var(--chart-4))" },
  Health: { label: "Health", color: "hsl(var(--chart-5))" },
  Fitness: { label: "Fitness", color: "hsl(150 100% 50%)" },
  Sports: { label: "Sports", color: "hsl(270 100% 60%)" },
  Clothing: { label: "Clothing", color: "hsl(30 100% 50%)" },
  Books: { label: "Books", color: "hsl(210 100% 60%)" },
  Gifts: { label: "Gifts", color: "hsl(330 100% 60%)" },
  Other: { label: "Other", color: "hsl(0 0% 70%)" },
} satisfies ChartConfig

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
    const { formatCurrency } = useAppContext();

  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0)
  }, [data])

  return (
     <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[250px] sm:h-[300px]" // Adjust size as needed
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                    hideLabel // Label inside pie is better
                    formatter={(value, name) => `${chartConfig[name as keyof typeof chartConfig]?.label}: ${formatCurrency(value as number)}`}
                    className="!bg-card/80 backdrop-blur-sm !border-secondary/50" // Style tooltip
                 />}
            />
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={60} // Make it a donut chart
              outerRadius={80}
              strokeWidth={5}
              labelLine={false} // Hide default label lines
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const percentage = (percent * 100).toFixed(0);

                   // Don't show label if percentage is too small
                   if (parseInt(percentage) < 5) return null;

                  return (
                  <text
                    x={x}
                    y={y}
                    fill="hsl(var(--foreground))" // Use foreground color
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-[10px] font-medium fill-foreground"
                  >
                    {`${percentage}%`}
                  </text>
                  );
              }}
            >
               {/* Define Cell colors based on category */}
               {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartConfig[entry.category as keyof typeof chartConfig]?.color || "hsl(var(--muted))"} />
               ))}
            </Pie>
             {/* Add Legend */}
              <ChartLegend
                content={<ChartLegendContent nameKey="category" className="text-xs flex-wrap justify-center" />} // Use flex-wrap for many categories
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingBottom: '0px', paddingTop: '10px' }} // Adjust spacing
                />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
  )
}
