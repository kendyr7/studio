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
  if (totalPrice === 0 && paidAmount === 0) return 'Pending'; // Or 'Paid' if 0 cost means it's acquired
  return 'Pending'; // Default case
}

export function calculateRemainingBalance(totalPrice: number, paidAmount: number): number {
  return Math.max(0, totalPrice - paidAmount);
}

export function enrichPurchaseItem(item: StoredPurchaseItem): PurchaseItem {
  const remainingBalance = calculateRemainingBalance(item.totalPrice, item.paidAmount);
  const status = calculateItemStatus(item.totalPrice, item.paidAmount);
  return { ...item, remainingBalance, status };
}

export function formatCurrency(amount: number, currencySymbol: string = '$'): string {
  return `${currencySymbol}${amount.toFixed(2)}`;
}
