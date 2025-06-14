
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
}

export function LogPaymentDialog({
  isOpen,
  onOpenChange,
  onSubmitLogPayment,
  itemBeingPaid,
  currencySymbol = "$",
}: LogPaymentDialogProps) {
  
  const form = useForm<LogPaymentFormData>({
    resolver: zodResolver(logPaymentSchema),
    defaultValues: {
      paymentAmount: undefined,
    },
  });

  React.useEffect(() => {
    if (isOpen && itemBeingPaid) {
      // Calculate suggested amount for the *next* payment
      const remainingForThisPayment = itemBeingPaid.totalPrice > 0 && itemBeingPaid.numberOfPayments > 0 
                                    ? itemBeingPaid.totalPrice / itemBeingPaid.numberOfPayments // This is an average, may not be accurate if payments are uneven
                                    : 0;
      
      let suggestedAmount = itemBeingPaid.remainingBalance; // Default to total remaining balance
      if (itemBeingPaid.numberOfPayments > 1 && itemBeingPaid.paymentsMade < itemBeingPaid.numberOfPayments) {
        // If multiple payments and not all made, suggest the smaller of average payment or remaining balance
        suggestedAmount = Math.min(itemBeingPaid.remainingBalance, remainingForThisPayment > 0 ? remainingForThisPayment : itemBeingPaid.remainingBalance);
      }
      
      // Don't prefill, let user decide
      form.reset({ paymentAmount: undefined });
    } else if (!isOpen) {
        form.reset({ paymentAmount: undefined });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemBeingPaid]); // form is not needed in deps for reset

  const handleFormSubmit = (data: LogPaymentFormData) => {
    if (itemBeingPaid) {
      onSubmitLogPayment(itemBeingPaid.id, data.paymentAmount);
    }
    onOpenChange(false);
  };

  if (!itemBeingPaid) return null;

  const nextPaymentNumber = itemBeingPaid.paymentsMade + 1;
  const dialogDescription = itemBeingPaid.numberOfPayments > 1 
    ? `Enter amount for payment ${nextPaymentNumber} of ${itemBeingPaid.numberOfPayments}. Remaining: ${formatCurrency(itemBeingPaid.remainingBalance, currencySymbol)}.`
    : `Enter payment amount. Remaining: ${formatCurrency(itemBeingPaid.remainingBalance, currencySymbol)}.`;


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
                      max={itemBeingPaid.remainingBalance} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <CreditCard className="mr-2 h-4 w-4" />
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
