
export type ItemStatus = 'Pending' | 'Partially Paid' | 'Paid';

export interface StoredPurchaseItem {
  id: string;
  name: string;
  totalPrice: number;
  notes?: string;
  numberOfPayments: number; 
  individualPayments: number[]; // Stores amount of each payment made
  includeInSpendCalculation: boolean;
}

export interface PurchaseItem extends StoredPurchaseItem {
  paidAmount: number; // Derived from individualPayments
  paymentsMade: number; // Derived from count of actual payments in individualPayments
  remainingBalance: number;
  status: ItemStatus;
}

export interface BudgetData {
  totalBudget: number;
  currencySymbol: string;
}

export interface AppData {
  version: string;
  budget: BudgetData;
  items: StoredPurchaseItem[];
}

export type SortableField = 'name' | 'totalPrice' | 'paidAmount' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortableField;
  direction: SortDirection;
}

export type FilterStatus = ItemStatus | 'All';
