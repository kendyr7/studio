
export type ItemStatus = 'Pending' | 'Partially Paid' | 'Paid';

export interface StoredPurchaseItem {
  id: string; // This will be the Firestore document ID for items
  name: string;
  totalPrice: number;
  notes?: string;
  numberOfPayments: number;
  individualPayments: number[]; // Stores amount for each payment
  includeInSpendCalculation: boolean;
}

// Enriched item for display purposes, not directly stored in this full form
export interface PurchaseItem extends StoredPurchaseItem {
  paidAmount: number; // Derived from sum of individualPayments
  paymentsMade: number; // Derived from count of positive individualPayments
  remainingBalance: number;
  status: ItemStatus;
}

export interface BudgetData {
  totalBudget: number;
  currencySymbol: string;
}

// Represents the data structure for a build list in Firestore
export interface BuildListData {
  name: string;
  createdAt: string; // ISO date string
  version: string;
  budget: BudgetData;
  userId: string; // To associate list with a user (placeholder for now)
  // 'items' will be a subcollection in Firestore, so not directly in this interface
}

// This is what we'll primarily work with when fetching a list.
// The 'items' array will be populated by fetching the subcollection.
export interface BuildList extends BuildListData {
  id: string; // Firestore document ID for the list
  items: StoredPurchaseItem[]; // Populated after fetching items subcollection
}

export type SortableField = 'name' | 'totalPrice' | 'paidAmount' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortableField;
  direction: SortDirection;
}

export type FilterStatus = ItemStatus | 'All';
