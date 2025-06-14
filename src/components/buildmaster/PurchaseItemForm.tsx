
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { PlusCircle, Edit, DollarSign } from "lucide-react";

const purchaseItemSchema = z.object({
  name: z.string().min(1, { message: "Product name is required." }).max(100),
  totalPrice: z.coerce.number().min(0, { message: "Total price must be non-negative." }),
  numberOfPayments: z.coerce.number().int().min(1, { message: "Number of payments must be at least 1."}).default(1),
  individualPayments: z.array(z.coerce.number().min(0, {message: "Payment amount must be non-negative"}).optional()).default([]),
  notes: z.string().max(500).optional(),
  includeInSpendCalculation: z.boolean().default(true),
})
.refine(data => {
    const sumOfIndividualPayments = data.individualPayments.reduce((acc, val) => acc + (val || 0), 0);
    // Allow sum to be slightly off due to potential float precision, but not significantly more than total price
    return sumOfIndividualPayments <= data.totalPrice + 0.001; // Small tolerance for float issues
}, {
  message: "Total of individual payments cannot exceed total price.",
  path: ["individualPayments"],
})
.refine(data => data.individualPayments.length <= data.numberOfPayments, {
    message: "Number of payment entries cannot exceed 'Number of Payments'.",
    path: ["individualPayments"],
});


export type PurchaseItemFormData = z.infer<typeof purchaseItemSchema>;

interface PurchaseItemFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: PurchaseItemFormData) => void;
  initialData?: StoredPurchaseItem;
  currencySymbol?: string;
  isOperating?: boolean;
}

export function PurchaseItemForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  currencySymbol = "$",
  isOperating = false,
}: PurchaseItemFormProps) {

  const getSafeFormValues = React.useCallback((data?: StoredPurchaseItem): PurchaseItemFormData => {
    const defaults: Omit<PurchaseItemFormData, 'individualPayments'> & { individualPayments?: (number | undefined)[] } = {
      name: "",
      totalPrice: 0,
      numberOfPayments: 1,
      notes: "",
      includeInSpendCalculation: true,
    };
    
    const numPayments = (data?.numberOfPayments !== undefined && data.numberOfPayments >= 1)
                            ? data.numberOfPayments
                            : defaults.numberOfPayments;

    let currentIndividualPayments: (number | undefined)[] = Array(numPayments).fill(undefined);
    if (data?.individualPayments) {
        for (let i = 0; i < numPayments; i++) {
            currentIndividualPayments[i] = data.individualPayments[i] ?? undefined;
        }
    }
    
    if (data) {
      return {
        name: data.name || defaults.name,
        totalPrice: data.totalPrice ?? defaults.totalPrice,
        numberOfPayments: numPayments,
        individualPayments: currentIndividualPayments,
        notes: data.notes || defaults.notes,
        includeInSpendCalculation: data.includeInSpendCalculation ?? defaults.includeInSpendCalculation,
      };
    }
    return {
        ...defaults,
        numberOfPayments: numPayments,
        individualPayments: currentIndividualPayments,
    } as PurchaseItemFormData;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed initialData from dependencies as it's handled by useEffect below
  
  const form = useForm<PurchaseItemFormData>({
    resolver: zodResolver(purchaseItemSchema),
    defaultValues: getSafeFormValues(initialData),
  });
  
  const watchedNumberOfPayments = useWatch({ control: form.control, name: "numberOfPayments" });
  // const watchedIndividualPayments = useWatch({ control: form.control, name: "individualPayments" }); // Not directly needed for this logic

  React.useEffect(() => {
    // Reset form when dialog opens or initialData changes
    if (isOpen) {
        form.reset(getSafeFormValues(initialData));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen, form.reset]); // form.reset is stable, getSafeFormValues is memoized

  React.useEffect(() => {
    const currentIndividualPayments = form.getValues("individualPayments") || [];
    const newNumberOfPayments = watchedNumberOfPayments || 1; // Ensure at least 1
    
    if (currentIndividualPayments.length !== newNumberOfPayments) {
      const newIndividualPaymentsArray: (number | undefined)[] = Array(newNumberOfPayments).fill(undefined);
      for (let i = 0; i < Math.min(currentIndividualPayments.length, newNumberOfPayments); i++) {
        newIndividualPaymentsArray[i] = currentIndividualPayments[i];
      }
      form.setValue("individualPayments", newIndividualPaymentsArray, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedNumberOfPayments, form]);


  const handleFormSubmit = (data: PurchaseItemFormData) => {
    const submissionData = {
        ...data,
        individualPayments: Array(data.numberOfPayments).fill(0).map((_,i) => data.individualPayments[i] || 0)
    };
    onSubmit(submissionData);
    // onOpenChange(false); // Let parent handle closing dialog on success/failure
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        // form.reset(getSafeFormValues(initialData)); // Reset on close handled by useEffect on isOpen
      }
    }}>
      <DialogContent className="sm:max-w-[520px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            {initialData ? "Edit Item" : "Add New Item"}
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Update the details of your PC component." : "Add a new component to your build list."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 p-1 max-h-[70vh] overflow-y-auto">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., NVIDIA RTX 4080" {...field} disabled={isOperating} />
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
                      <Input type="number" step="0.01" placeholder="e.g., 799.99" {...field} disabled={isOperating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfPayments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Payments</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="1" placeholder="e.g., 3" {...field} 
                       onChange={(e) => {
                          let val = parseInt(e.target.value, 10);
                          if (isNaN(val) || val < 1) val = 1; // Ensure val is at least 1
                          field.onChange(val);
                       }}
                       disabled={isOperating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchedNumberOfPayments > 0 && (
              <div className="space-y-3 pt-2">
                <FormLabel className="text-base">Individual Payments ({currencySymbol})</FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {Array.from({ length: watchedNumberOfPayments || 0 }).map((_, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`individualPayments.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Payment {index + 1}</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                {...field} 
                                value={field.value ?? ""}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    field.onChange(isNaN(val) ? undefined : val); // Allow empty string to become undefined, then 0 in submit
                                }}
                                className="pl-7"
                                disabled={isOperating}
                               />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Purchased with a 3-month plan" {...field} disabled={isOperating} />
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
                      disabled={isOperating}
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
            <DialogFooter className="sm:justify-end gap-2 pt-4 sticky bottom-0 bg-card pb-2">
              <DialogClose asChild>
                 <Button type="button" variant="secondary" disabled={isOperating}>Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isOperating}>
                {isOperating ? (initialData ? "Saving..." : "Adding...") : (initialData ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                {isOperating ? (initialData ? "Save Changes" : "Add Item") : (initialData ? "Save Changes" : "Add Item")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
