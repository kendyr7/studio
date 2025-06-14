
export type ItemStatus = 'Pending' | 'Partially Paid' | 'Paid';

export interface StoredPurchaseItem {
  id: string;
  name: string;
  totalPrice: number;
  notes?: string;
  numberOfPayments: number;
  individualPayments: number[];
  includeInSpendCalculation: boolean;
}

export interface PurchaseItem extends StoredPurchaseItem {
  paidAmount: number;
  paymentsMade: number;
  remainingBalance: number;
  status: ItemStatus;
}

export interface BudgetData {
  totalBudget: number;
  currencySymbol: string;
}

// Renamed from AppData
export interface BuildListData {
  version: string;
  budget: BudgetData;
  items: StoredPurchaseItem[];
}

export interface BuildList extends BuildListData {
  id: string;
  name: string;
  createdAt: string; // ISO date string
}

export interface AllBuilds {
  lists: BuildList[];
}

export type SortableField = 'name' | 'totalPrice' | 'paidAmount' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortableField;
  direction: SortDirection;
}

export type FilterStatus = ItemStatus | 'All';
