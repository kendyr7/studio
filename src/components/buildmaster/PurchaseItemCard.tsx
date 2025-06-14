"use client";

import type { PurchaseItem } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { Edit2, Trash2, CalendarDays, StickyNote, CheckSquare, Square } from "lucide-react";
import { formatCurrency, calculateItemStatus } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { Checkbox } from '../ui/checkbox';

interface PurchaseItemCardProps {
  item: PurchaseItem;
  onEdit: (item: PurchaseItem) => void;
  onDelete: (itemId: string) => void;
  onToggleIncludeInSpend: (itemId: string, include: boolean) => void;
  currencySymbol?: string;
}

export function PurchaseItemCard({ item, onEdit, onDelete, onToggleIncludeInSpend, currencySymbol = "$" }: PurchaseItemCardProps) {
  const progressPercentage = item.totalPrice > 0 ? (item.paidAmount / item.totalPrice) * 100 : (item.paidAmount > 0 ? 100 : 0);
  const statusColor = item.status === 'Paid' ? 'hsl(var(--accent))' : item.status === 'Partially Paid' ? 'hsl(var(--primary))' : 'hsl(var(--muted))';

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-primary/30 transition-shadow duration-300 ease-in-out">
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
            <span>Progress</span>
            <span>{formatCurrency(item.remainingBalance, currencySymbol)} remaining</span>
          </div>
          <Progress value={progressPercentage} aria-label={`${item.name} payment progress`} style={{accentColor: statusColor}} className="h-2 [&>div]:bg-primary" />
        </div>
        
        {item.estimatedCompletionDate && (
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Est. Completion: {format(parseISO(item.estimatedCompletionDate), "MMM d, yyyy")}
          </div>
        )}
        {item.notes && (
          <div className="flex items-start text-xs text-muted-foreground">
            <StickyNote className="h-3.5 w-3.5 mr-1.5 mt-0.5 shrink-0" />
            <p className="truncate-3-lines">{item.notes}</p>
          </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t">
         <div className="flex items-center space-x-2 text-xs">
            <Checkbox
                id={`include-${item.id}`}
                checked={item.includeInSpendCalculation}
                onCheckedChange={(checked) => onToggleIncludeInSpend(item.id, !!checked)}
                aria-labelledby={`include-label-${item.id}`}
            />
            <label htmlFor={`include-${item.id}`} id={`include-label-${item.id}`} className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Count in total
            </label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
