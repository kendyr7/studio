import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ItemStatus, StoredPurchaseItem, PurchaseItem } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateItemStatus(totalPrice: number, paidAmount: number): ItemStatus {
  if (paidAmount <= 0 && totalPrice > 0) return 'Pending';
  if (paidAmount > 0 && paidAmount < totalPrice) return 'Partially Paid';
  if (paidAmount >= totalPrice && totalPrice > 0) return 'Paid';
  if (totalPrice === 0 && paidAmount === 0) return 'Pending'; 
  return 'Pending'; 
}

export function calculateRemainingBalance(totalPrice: number, paidAmount: number): number {
  return Math.max(0, totalPrice - paidAmount);
}

export function enrichPurchaseItem(item: StoredPurchaseItem): PurchaseItem {
  const paidAmount = item.individualPayments.reduce((sum, payment) => sum + (payment || 0), 0);
  const paymentsMade = item.individualPayments.filter(p => p > 0).length;
  
  const remainingBalance = calculateRemainingBalance(item.totalPrice, paidAmount);
  const status = calculateItemStatus(item.totalPrice, paidAmount);
  
  return { 
    ...item, 
    paidAmount,
    paymentsMade,
    remainingBalance, 
    status 
  };
}

export function formatCurrency(amount: number, currencySymbol: string = '$'): string {
  return `${currencySymbol}${(amount || 0).toFixed(2)}`;
}
