
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { PurchaseItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";

const logPaymentSchema = z.object({
  paymentAmount: z.coerce
    .number()
    .min(0.01, { message: "Payment amount must be greater than 0." }),
});

export type LogPaymentFormData = z.infer<typeof logPaymentSchema>;

interface LogPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitLogPayment: (itemId: string, amount: number) => void;
  itemBeingPaid?: PurchaseItem;
  currencySymbol?: string;
  isOperating?: boolean;
}

export function LogPaymentDialog({
  isOpen,
  onOpenChange,
  onSubmitLogPayment,
  itemBeingPaid,
  currencySymbol = "$",
  isOperating = false,
}: LogPaymentDialogProps) {
  
  const form = useForm<LogPaymentFormData>({
    resolver: zodResolver(logPaymentSchema),
    defaultValues: {
      paymentAmount: undefined,
    },
  });

  React.useEffect(() => {
    if (isOpen && itemBeingPaid) {
      const alreadyPaidSlots = itemBeingPaid.individualPayments.filter(p => (p || 0) > 0).length;
      const remainingSlots = itemBeingPaid.numberOfPayments - alreadyPaidSlots;
      
      let suggestedAmount = 0;
      if (remainingSlots > 0 && itemBeingPaid.totalPrice > 0) {
        const remainingBalanceOverall = itemBeingPaid.totalPrice - itemBeingPaid.paidAmount;
        suggestedAmount = Math.max(0, Math.min(remainingBalanceOverall, itemBeingPaid.totalPrice / itemBeingPaid.numberOfPayments));
      } else {
        suggestedAmount = Math.max(0, itemBeingPaid.remainingBalance);
      }

      form.reset({ paymentAmount: suggestedAmount > 0 ? parseFloat(suggestedAmount.toFixed(2)) : undefined });

    } else if (!isOpen) {
        form.reset({ paymentAmount: undefined });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemBeingPaid]); // form is not needed in deps for reset

  const handleFormSubmit = (data: LogPaymentFormData) => {
    if (itemBeingPaid) {
      onSubmitLogPayment(itemBeingPaid.id, data.paymentAmount);
    }
    // onOpenChange(false); // Let parent handle closing dialog
  };

  if (!itemBeingPaid) return null;

  const nextPaymentNumber = itemBeingPaid.paymentsMade + 1;
  const dialogDescription = itemBeingPaid.numberOfPayments > 1 
    ? `Log amount for payment ${nextPaymentNumber > itemBeingPaid.numberOfPayments ? itemBeingPaid.numberOfPayments : nextPaymentNumber} of ${itemBeingPaid.numberOfPayments}. Total remaining: ${formatCurrency(itemBeingPaid.remainingBalance, currencySymbol)}.`
    : `Enter payment amount. Total remaining: ${formatCurrency(itemBeingPaid.remainingBalance, currencySymbol)}.`;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset({ paymentAmount: undefined });
      }
    }}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Log Payment for {itemBeingPaid.name}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 p-1">
            <FormField
              control={form.control}
              name="paymentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount ({currencySymbol})</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 50.00" 
                      {...field} 
                      max={itemBeingPaid.remainingBalance > 0 ? itemBeingPaid.remainingBalance : undefined} 
                      disabled={isOperating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isOperating}>Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isOperating || itemBeingPaid.remainingBalance <= 0}>
                {isOperating ? "Logging..." : <CreditCard className="mr-2 h-4 w-4" />}
                {isOperating ? "Confirm Payment" : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
