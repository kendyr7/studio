
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { StoredPurchaseItem } from "@/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { PlusCircle, Edit } from "lucide-react";

const purchaseItemSchema = z.object({
  name: z.string().min(1, { message: "Product name is required." }).max(100),
  totalPrice: z.coerce.number().min(0, { message: "Total price must be non-negative." }),
  paidAmount: z.coerce.number().min(0, { message: "Paid amount must be non-negative." }),
  numberOfPayments: z.coerce.number().int().min(1, { message: "Number of payments must be at least 1."}).default(1),
  notes: z.string().max(500).optional(),
  includeInSpendCalculation: z.boolean().default(true),
}).refine(data => data.paidAmount <= data.totalPrice, {
  message: "Paid amount cannot exceed total price.",
  path: ["paidAmount"],
});

export type PurchaseItemFormData = z.infer<typeof purchaseItemSchema>;

interface PurchaseItemFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: PurchaseItemFormData) => void;
  initialData?: StoredPurchaseItem;
  currencySymbol?: string;
}

export function PurchaseItemForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  currencySymbol = "$",
}: PurchaseItemFormProps) {

  const getSafeFormValues = React.useCallback((data?: StoredPurchaseItem) => {
    const defaults = {
      name: "",
      totalPrice: 0,
      paidAmount: 0,
      numberOfPayments: 1, // Default to 1
      notes: "",
      includeInSpendCalculation: true,
    };

    if (data) {
      return {
        name: data.name || defaults.name,
        totalPrice: data.totalPrice ?? defaults.totalPrice,
        paidAmount: data.paidAmount ?? defaults.paidAmount,
        // Ensure numberOfPayments is at least 1, or use default if not present
        numberOfPayments: (data.numberOfPayments !== undefined && data.numberOfPayments !== null && data.numberOfPayments >= 1)
                          ? data.numberOfPayments
                          : defaults.numberOfPayments,
        notes: data.notes || defaults.notes,
        includeInSpendCalculation: data.includeInSpendCalculation ?? defaults.includeInSpendCalculation,
      };
    }
    return defaults;
  }, []);

  const form = useForm<PurchaseItemFormData>({
    resolver: zodResolver(purchaseItemSchema),
    defaultValues: getSafeFormValues(initialData),
  });

  React.useEffect(() => {
    form.reset(getSafeFormValues(initialData));
  }, [initialData, form, getSafeFormValues]);


  const handleFormSubmit = (data: PurchaseItemFormData) => {
    onSubmit(data);
    onOpenChange(false); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset(getSafeFormValues(initialData)); 
      }
    }}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            {initialData ? "Edit Item" : "Add New Item"}
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Update the details of your PC component." : "Add a new component to your build list."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 p-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., NVIDIA RTX 4080" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Price ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 799.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 300.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="numberOfPayments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Payments</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min="1" placeholder="e.g., 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Purchased with a 3-month plan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="includeInSpendCalculation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Include remaining balance in total spend comparison
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-end gap-2 pt-4">
              <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {initialData ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {initialData ? "Save Changes" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
