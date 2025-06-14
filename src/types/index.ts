
export type ItemStatus = 'Pending' | 'Partially Paid' | 'Paid';

export interface StoredPurchaseItem {
  id: string;
  name: string;
  totalPrice: number;
  paidAmount: number;
  notes?: string;
  numberOfPayments: number; // Added
  paymentsMade: number;    // Added
  includeInSpendCalculation: boolean;
}

export interface PurchaseItem extends StoredPurchaseItem {
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

export type SortableField = 'name' | 'totalPrice' | 'paidAmount' | 'status'; // Removed 'estimatedCompletionDate'
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortableField;
  direction: SortDirection;
}

export type FilterStatus = ItemStatus | 'All';
