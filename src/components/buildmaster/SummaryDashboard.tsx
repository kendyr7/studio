
"use client";

import type { BudgetData, PurchaseItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { BarChart as BarChartIcon, PiggyBank, ListChecks } from "lucide-react"; // Renamed BarChart to BarChartIcon to avoid conflict
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'; //shadcn chart components
import { Bar, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart } from 'recharts'; // Import recharts primitives
import type { ChartConfig } from '@/components/ui/chart';

interface SummaryDashboardProps {
  budgetData: BudgetData;
  items: PurchaseItem[];
}

export function SummaryDashboard({ budgetData, items }: SummaryDashboardProps) {
  const totalPaidAll = items.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalCostAll = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  const overallProgressPercentage = totalCostAll > 0 ? (totalPaidAll / totalCostAll) * 100 : 0;

  const itemsPending = items.filter(item => item.status === 'Pending').length;
  const itemsPartiallyPaid = items.filter(item => item.status === 'Partially Paid').length;
  const itemsPaid = items.filter(item => item.status === 'Paid').length;

  const chartData = [
    { status: 'Pending', count: itemsPending, fill: "hsl(var(--destructive))" },
    { status: 'Partially Paid', count: itemsPartiallyPaid, fill: "hsl(var(--primary))" },
    { status: 'Paid', count: itemsPaid, fill: "hsl(var(--accent))" },
  ];

  const chartConfig = {
    count: {
      label: 'Items',
      color: 'hsl(var(--foreground))',
    },
     Pending: { label: "Pending", color: "hsl(var(--destructive))" },
     "Partially Paid": { label: "Partially Paid", color: "hsl(var(--primary))" },
     Paid: { label: "Paid", color: "hsl(var(--accent))" },
  } satisfies ChartConfig;


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <PiggyBank className="h-7 w-7 mr-2 text-primary" />
          Build Progress Summary
        </CardTitle>
        <CardDescription>Overall status of your PC build funding and item acquisition.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-1">Overall Payment Progress (All Items)</h3>
          <Progress value={overallProgressPercentage} aria-label="Overall payment progress" className="h-3 [&>div]:bg-accent" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatCurrency(totalPaidAll, budgetData.currencySymbol)} paid of {formatCurrency(totalCostAll, budgetData.currencySymbol)} total cost</span>
            <span>{overallProgressPercentage.toFixed(1)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoBox icon={ListChecks} title="Items Pending" value={itemsPending.toString()} color="text-destructive" />
            <InfoBox icon={ListChecks} title="Items Partially Paid" value={itemsPartiallyPaid.toString()} color="text-primary" />
            <InfoBox icon={ListChecks} title="Items Paid" value={itemsPaid.toString()} color="text-accent" />
        </div>
        
        <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
                <BarChartIcon className="h-5 w-5 mr-2 text-primary" /> Item Status Distribution
            </h3>
            {items.length > 0 ? (
                 <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <RechartsBarChart accessibilityLayer data={chartData} margin={{left: -20}}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="count" radius={5} />
                    </RechartsBarChart>
                </ChartContainer>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No items to display in chart.</p>
            )}
        </div>

      </CardContent>
    </Card>
  );
}

interface InfoBoxProps {
    icon: React.ElementType;
    title: string;
    value: string;
    color?: string;
}

function InfoBox({ icon: Icon, title, value, color = "text-foreground" }: InfoBoxProps) {
    return (
        <div className="p-4 bg-card-foreground/5 rounded-lg">
            <div className="flex items-center text-muted-foreground mb-1">
                <Icon className={`h-4 w-4 mr-1.5 ${color === "text-foreground" ? "" : color}`} />
                <h4 className="text-xs font-medium">{title}</h4>
            </div>
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        </div>
    )
}
