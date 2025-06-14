"use client";

import type { BudgetData, PurchaseItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface BudgetManagerProps {
  budgetData: BudgetData;
  items: PurchaseItem[];
  onUpdateBudget: (newTotalBudget: number) => void;
  onUpdateCurrency: (newCurrencySymbol: string) => void;
}

export function BudgetManager({ budgetData, items, onUpdateBudget, onUpdateCurrency }: BudgetManagerProps) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(budgetData.totalBudget.toString());
  const [editingCurrency, setEditingCurrency] = useState(false);
  const [newCurrency, setNewCurrency] = useState(budgetData.currencySymbol);

  useEffect(() => {
    setNewBudget(budgetData.totalBudget.toString());
  }, [budgetData.totalBudget]);

  useEffect(() => {
    setNewCurrency(budgetData.currencySymbol);
  }, [budgetData.currencySymbol]);

  const totalPaid = items.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalRemainingOnIncludedItems = items
    .filter(item => item.includeInSpendCalculation)
    .reduce((sum, item) => sum + item.remainingBalance, 0);
  
  const totalProjectedCost = items
    .filter(item => item.includeInSpendCalculation)
    .reduce((sum, item) => sum + item.totalPrice, 0);

  const budgetUsagePercentage = budgetData.totalBudget > 0 ? (totalProjectedCost / budgetData.totalBudget) * 100 : 0;
  const differenceFromBudget = budgetData.totalBudget - totalProjectedCost;

  const handleBudgetSave = () => {
    const budgetValue = parseFloat(newBudget);
    if (!isNaN(budgetValue) && budgetValue >= 0) {
      onUpdateBudget(budgetValue);
    }
    setEditingBudget(false);
  };
  
  const handleCurrencySave = () => {
    if (newCurrency.trim() !== "") {
        onUpdateCurrency(newCurrency.trim());
    }
    setEditingCurrency(false);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center justify-between">
          Budget Overview
          <div className="flex items-center gap-2">
            {editingCurrency ? (
                 <div className="flex items-center gap-1">
                    <Input
                        type="text"
                        value={newCurrency}
                        onChange={(e) => setNewCurrency(e.target.value)}
                        className="h-8 w-16 text-lg"
                        maxLength={3}
                    />
                    <Button size="sm" onClick={handleCurrencySave} className="h-8">Save</Button>
                 </div>
            ) : (
                 <Button variant="ghost" size="sm" onClick={() => setEditingCurrency(true)} className="text-lg p-1 h-auto">{budgetData.currencySymbol}</Button>
            )}
            {editingBudget ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="h-8 w-32 text-lg"
                  step="0.01"
                />
                <Button size="sm" onClick={handleBudgetSave} className="h-8">Save</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditingBudget(true)} className="text-2xl p-1 h-auto">
                {formatCurrency(budgetData.totalBudget, budgetData.currencySymbol)}
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>Your total allocated budget for this build.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-sm font-medium">Projected Budget Usage</span>
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Based on total price of items marked 'Count in total'.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
          <Progress value={Math.min(budgetUsagePercentage, 100)} aria-label="Budget usage progress" className="h-3 [&>div]:bg-primary" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatCurrency(totalProjectedCost, budgetData.currencySymbol)} of {formatCurrency(budgetData.totalBudget, budgetData.currencySymbol)}</span>
            <span>{budgetUsagePercentage.toFixed(1)}% Used</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
          <div className="p-3 bg-card-foreground/5 rounded-md">
            <h4 className="text-xs text-muted-foreground font-medium mb-0.5">Total Paid</h4>
            <p className="text-xl font-semibold text-accent flex items-center justify-center md:justify-start">
              <DollarSign className="h-5 w-5 mr-1 opacity-70" />
              {formatCurrency(totalPaid, budgetData.currencySymbol)}
            </p>
          </div>
          <div className="p-3 bg-card-foreground/5 rounded-md">
            <h4 className="text-xs text-muted-foreground font-medium mb-0.5">Total Remaining (Included Items)</h4>
            <p className="text-xl font-semibold text-primary flex items-center justify-center md:justify-start">
              <DollarSign className="h-5 w-5 mr-1 opacity-70" />
              {formatCurrency(totalRemainingOnIncludedItems, budgetData.currencySymbol)}
            </p>
          </div>
          <div className="p-3 bg-card-foreground/5 rounded-md">
            <h4 className="text-xs text-muted-foreground font-medium mb-0.5">Budget Status</h4>
            <p className={`text-xl font-semibold flex items-center justify-center md:justify-start ${differenceFromBudget >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              {differenceFromBudget >= 0 ? <TrendingUp className="h-5 w-5 mr-1 opacity-70" /> : <TrendingDown className="h-5 w-5 mr-1 opacity-70" />}
              {formatCurrency(Math.abs(differenceFromBudget), budgetData.currencySymbol)}
              <span className="text-xs ml-1">{differenceFromBudget >= 0 ? 'Under' : 'Over'}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
