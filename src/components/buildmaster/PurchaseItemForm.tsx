"use client";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const purchaseItemSchema = z.object({
  name: z.string().min(1, { message: "Product name is required." }).max(100),
  totalPrice: z.coerce.number().min(0, { message: "Total price must be non-negative." }),
  paidAmount: z.coerce.number().min(0, { message: "Paid amount must be non-negative." }),
  notes: z.string().max(500).optional(),
  estimatedCompletionDate: z.date().optional(),
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
  const form = useForm<PurchaseItemFormData>({
    resolver: zodResolver(purchaseItemSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          estimatedCompletionDate: initialData.estimatedCompletionDate
            ? parseISO(initialData.estimatedCompletionDate)
            : undefined,
        }
      : {
          name: "",
          totalPrice: 0,
          paidAmount: 0,
          notes: "",
          estimatedCompletionDate: undefined,
          includeInSpendCalculation: true,
        },
  });

  const handleFormSubmit = (data: PurchaseItemFormData) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              name="estimatedCompletionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Est. Payment Completion</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <Textarea placeholder="e.g., Waiting for sale, alternative: RX 7900 XTX" {...field} />
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
