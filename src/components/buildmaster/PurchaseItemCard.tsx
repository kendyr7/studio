
"use client";

import type { PurchaseItem } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { Edit2, Trash2, StickyNote, ListChecks, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Checkbox } from '../ui/checkbox';

interface PurchaseItemCardProps {
  item: PurchaseItem;
  onEdit: (itemStored: PurchaseItem) => void; 
  onDelete: (itemId: string) => void;
  onToggleIncludeInSpend: (itemId: string, include: boolean) => void;
  onOpenLogPaymentModal: (item: PurchaseItem) => void;
  currencySymbol?: string;
  disabled?: boolean;
}

export function PurchaseItemCard({ 
    item, 
    onEdit, 
    onDelete, 
    onToggleIncludeInSpend, 
    onOpenLogPaymentModal,
    currencySymbol = "$",
    disabled = false,
}: PurchaseItemCardProps) {
  const monetaryProgressPercentage = item.totalPrice > 0 ? (item.paidAmount / item.totalPrice) * 100 : (item.paidAmount > 0 ? 100 : 0);
  
  const paymentsMadeCount = item.paymentsMade;
  const numberOfPaymentsCount = item.numberOfPayments;

  const canLogPayment = paymentsMadeCount < numberOfPaymentsCount && item.paidAmount < item.totalPrice;
  
  const paymentsLoggedProgressPercentage = numberOfPaymentsCount > 0 ? (paymentsMadeCount / numberOfPaymentsCount) * 100 : 0;

  const logPaymentButtonText = () => {
    if (numberOfPaymentsCount > 1) {
      const nextPaymentNumber = paymentsMadeCount + 1;
      return `Log Payment (${nextPaymentNumber > numberOfPaymentsCount ? numberOfPaymentsCount : nextPaymentNumber}/${numberOfPaymentsCount})`;
    }
    return "Log Payment";
  };

  return (
    <Card className={`flex flex-col h-full shadow-lg hover:shadow-primary/30 transition-shadow duration-300 ease-in-out ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl mb-1">{item.name}</CardTitle>
          <ItemStatusBadge status={item.status} />
        </div>
        <CardDescription className="text-sm">
          {formatCurrency(item.paidAmount, currencySymbol)} paid / {formatCurrency(item.totalPrice, currencySymbol)} total
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Overall Progress</span>
            <span>{formatCurrency(item.remainingBalance, currencySymbol)} remaining</span>
          </div>
          <Progress value={monetaryProgressPercentage} aria-label={`${item.name} payment progress`} className="h-2 [&>div]:bg-primary" />
        </div>
        
        {numberOfPaymentsCount > 1 && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center text-xs text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              Payments Logged: {paymentsMadeCount} / {numberOfPaymentsCount}
            </div>
             <Progress 
                value={paymentsLoggedProgressPercentage} 
                aria-label="Payments logged progress" 
                className="h-2 [&>div]:bg-yellow-500" 
            />
          </div>
        )}

        {item.notes && (
          <div className="flex items-start text-xs text-muted-foreground pt-1">
            <StickyNote className="h-3.5 w-3.5 mr-1.5 mt-0.5 shrink-0" />
            <p className="truncate-3-lines">{item.notes}</p> {/* Consider expanding this or tooltip for full notes */}
          </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 pt-3 border-t">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-xs">
                <Checkbox
                    id={`include-${item.id}`}
                    checked={item.includeInSpendCalculation}
                    onCheckedChange={(checked) => onToggleIncludeInSpend(item.id, !!checked)}
                    aria-labelledby={`include-label-${item.id}`}
                    disabled={disabled}
                />
                <label htmlFor={`include-${item.id}`} id={`include-label-${item.id}`} className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Count in total
                </label>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} disabled={disabled}>
                    <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`} disabled={disabled}>
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
        
        <Button
            variant="default"
            size="sm"
            onClick={() => onOpenLogPaymentModal(item)}
            disabled={!canLogPayment || disabled}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
            <CreditCard className="mr-2 h-4 w-4" />
            {logPaymentButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}
