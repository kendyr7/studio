
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PurchaseItemForm, type PurchaseItemFormData } from "@/components/buildmaster/PurchaseItemForm";
import { PurchaseItemCard } from "@/components/buildmaster/PurchaseItemCard";
import { BudgetManager } from "@/components/buildmaster/BudgetManager";
import { SummaryDashboard } from "@/components/buildmaster/SummaryDashboard";
import { SortFilterControls } from "@/components/buildmaster/SortFilterControls";
import { LogPaymentDialog } from "@/components/buildmaster/LogPaymentDialog";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { StoredPurchaseItem, PurchaseItem as DisplayPurchaseItem, BudgetData, AppData, SortConfig, FilterStatus, SortableField, ItemStatus } from "@/types";
import { APP_DATA_VERSION, LOCAL_STORAGE_KEY } from "@/lib/constants";
import { enrichPurchaseItem } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

const initialAppData: AppData = {
  version: APP_DATA_VERSION,
  budget: { totalBudget: 1500, currencySymbol: "$" },
  items: [],
};

export default function BuildMasterPage() {
  const [appData, setAppData] = useLocalStorage<AppData>(LOCAL_STORAGE_KEY, initialAppData);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoredPurchaseItem | undefined>(undefined);
  
  const [isLogPaymentModalOpen, setIsLogPaymentModalOpen] = useState(false);
  const [itemToLogPaymentFor, setItemToLogPaymentFor] = useState<DisplayPurchaseItem | undefined>(undefined);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (appData.version !== APP_DATA_VERSION) {
        console.warn(`Data version mismatch. Expected ${APP_DATA_VERSION}, found ${appData.version}. Consider migrating data.`);
    }

    // One-time shallow migration for items from old structure
    setAppData(prev => {
      const migratedItems = prev.items.map(item => {
        const oldItem = item as any; // To access potentially old fields
        if (!item.individualPayments && typeof oldItem.paidAmount !== 'undefined' && typeof oldItem.paymentsMade !== 'undefined') {
          const newIndividualPayments = Array(item.numberOfPayments || 1).fill(0);
          if (oldItem.paymentsMade === 1 && item.numberOfPayments === 1 && oldItem.paidAmount > 0) {
            newIndividualPayments[0] = oldItem.paidAmount;
          } else if (oldItem.paymentsMade > 0 && item.numberOfPayments > 0 && oldItem.paidAmount > 0) {
            // This is a lossy conversion for multi-payment old items.
            // We can put the total paid amount into the first payment slot if number of payments is 1.
            // Or distribute if paymentsMade and numberOfPayments match.
            // For simplicity, if it was multi-payment, let user re-enter.
            if (item.numberOfPayments === 1) {
                 newIndividualPayments[0] = oldItem.paidAmount;
            }
          }
          return {
            ...item,
            individualPayments: newIndividualPayments,
            paidAmount: undefined, // Remove old field
            paymentsMade: undefined, // Remove old field
          } as StoredPurchaseItem;
        }
        // Ensure individualPayments array matches numberOfPayments
        if (item.individualPayments && item.individualPayments.length !== (item.numberOfPayments || 1)) {
            const correctedPayments = Array(item.numberOfPayments || 1).fill(0);
            for(let i=0; i< Math.min(item.individualPayments.length, correctedPayments.length); i++) {
                correctedPayments[i] = item.individualPayments[i];
            }
            return {...item, individualPayments: correctedPayments};
        }
        return item;
      });
      if (JSON.stringify(prev.items) !== JSON.stringify(migratedItems)) {
        return { ...prev, items: migratedItems };
      }
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData.version]);


  const handleAddItem = (data: PurchaseItemFormData) => {
    const newItem: StoredPurchaseItem = {
      id: crypto.randomUUID(),
      name: data.name,
      totalPrice: data.totalPrice,
      numberOfPayments: data.numberOfPayments,
      individualPayments: data.individualPayments.map(p => p || 0),
      notes: data.notes,
      includeInSpendCalculation: data.includeInSpendCalculation,
    };
    setAppData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    toast({ title: "Item Added", description: `${data.name} has been added to your list.` });
  };

  const handleEditItem = (data: PurchaseItemFormData) => {
    if (!editingItem) return;
    const updatedItem: StoredPurchaseItem = {
      ...editingItem,
      name: data.name,
      totalPrice: data.totalPrice,
      numberOfPayments: data.numberOfPayments,
      individualPayments: data.individualPayments.map(p => p || 0),
      notes: data.notes,
      includeInSpendCalculation: data.includeInSpendCalculation,
    };
    setAppData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === editingItem.id ? updatedItem : item),
    }));
    setEditingItem(undefined);
    toast({ title: "Item Updated", description: `${data.name} has been updated.` });
  };

  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = appData.items.find(item => item.id === itemId);
    setAppData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
    if (itemToDelete) {
        toast({ title: "Item Deleted", description: `${itemToDelete.name} has been removed.`, variant: "destructive" });
    }
  };

  const openEditForm = (item: StoredPurchaseItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };
  
  const handleToggleIncludeInSpend = (itemId: string, include: boolean) => {
    setAppData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, includeInSpendCalculation: include } : item
      ),
    }));
  };

  const handleUpdateBudget = (newTotalBudget: number) => {
    setAppData(prev => ({ ...prev, budget: { ...prev.budget, totalBudget: newTotalBudget } }));
    toast({ title: "Budget Updated", description: `Total budget set to ${appData.budget.currencySymbol}${newTotalBudget.toFixed(2)}.` });
  };

  const handleUpdateCurrency = (newCurrencySymbol: string) => {
    setAppData(prev => ({ ...prev, budget: { ...prev.budget, currencySymbol: newCurrencySymbol } }));
    toast({ title: "Currency Updated", description: `Currency symbol set to ${newCurrencySymbol}.` });
  };

  const handleSortChange = (field: SortableField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  
  const openLogPaymentModal = (item: DisplayPurchaseItem) => {
    setItemToLogPaymentFor(item);
    setIsLogPaymentModalOpen(true);
  };

  const handleLogPayment = useCallback((itemId: string, paymentAmount: number) => {
    setAppData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const newIndividualPayments = [...item.individualPayments];
          let paymentLogged = false;
          for (let i = 0; i < newIndividualPayments.length; i++) {
            if ((newIndividualPayments[i] === 0 || newIndividualPayments[i] === undefined) && !paymentLogged) {
              newIndividualPayments[i] = paymentAmount;
              paymentLogged = true;
              break; 
            }
          }
          
          if (paymentLogged) {
             // Recalculate total paid to ensure it doesn't exceed total price
            let currentTotalPaid = newIndividualPayments.reduce((sum, p) => sum + (p || 0), 0);
            if (currentTotalPaid > item.totalPrice) {
                // If overpaid due to this payment, adjust this payment
                const overPayment = currentTotalPaid - item.totalPrice;
                const lastLoggedPaymentIndex = newIndividualPayments.indexOf(paymentAmount); // find the current payment
                 if (lastLoggedPaymentIndex !== -1) {
                    newIndividualPayments[lastLoggedPaymentIndex] = Math.max(0, paymentAmount - overPayment);
                 }
            }

            return { 
              ...item, 
              individualPayments: newIndividualPayments
            };
          }
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
    const itemData = appData.items.find(i => i.id === itemId);
    if (itemData) {
      toast({ title: "Payment Logged", description: `Payment of ${appData.budget.currencySymbol}${paymentAmount.toFixed(2)} logged for ${itemData.name}.` });
    }
    setIsLogPaymentModalOpen(false);
  }, [setAppData, appData.items, appData.budget.currencySymbol, toast]);


  const displayItems: DisplayPurchaseItem[] = useMemo(() => {
    let items = appData.items.map(item => {
      const storedItemWithDefaults: StoredPurchaseItem = {
        id: item.id,
        name: item.name,
        totalPrice: item.totalPrice ?? 0,
        notes: item.notes,
        numberOfPayments: item.numberOfPayments ?? 1,
        individualPayments: item.individualPayments && item.individualPayments.length > 0 
            ? item.individualPayments 
            : Array(item.numberOfPayments || 1).fill(0),
        includeInSpendCalculation: item.includeInSpendCalculation ?? true,
      };
      return enrichPurchaseItem(storedItemWithDefaults);
    });

    if (filterStatus !== 'All') {
      items = items.filter(item => item.status === filterStatus);
    }
    
    items.sort((a, b) => {
      let valA = a[sortConfig.field];
      let valB = b[sortConfig.field];

      if (sortConfig.field === 'status') {
        const statusOrder: Record<ItemStatus, number> = { 'Pending': 1, 'Partially Paid': 2, 'Paid': 3 };
        valA = statusOrder[a.status];
        valB = statusOrder[b.status];
      } else if (sortConfig.field === 'paidAmount') { // Ensure derived paidAmount is used for sorting
        valA = a.paidAmount;
        valB = b.paidAmount;
      }


      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [appData.items, filterStatus, sortConfig]);


  if (!isClient) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
            <div className="flex items-center space-x-2">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl font-headline">Loading BuildMaster...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <BudgetManager
          budgetData={appData.budget}
          items={displayItems}
          onUpdateBudget={handleUpdateBudget}
          onUpdateCurrency={handleUpdateCurrency}
        />

        <div className="mt-8 mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-headline text-primary">My Components</h2>
          <Button onClick={openAddForm} variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Item
          </Button>
        </div>

        <SortFilterControls
          sortConfig={sortConfig}
          filterStatus={filterStatus}
          onSortChange={handleSortChange}
          onFilterChange={setFilterStatus}
        />
        
        {displayItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayItems.map(item => (
              <PurchaseItemCard
                key={item.id}
                item={item}
                onEdit={() => openEditForm(appData.items.find(i => i.id === item.id)!)}
                onDelete={handleDeleteItem}
                onToggleIncludeInSpend={handleToggleIncludeInSpend}
                onOpenLogPaymentModal={openLogPaymentModal}
                currencySymbol={appData.budget.currencySymbol}
              />
            ))}
          </div>
        ) : (
          <Card className="col-span-full text-center py-12 shadow">
            <CardContent className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />
              <p className="text-xl font-medium">No components added yet.</p>
              <p className="text-muted-foreground">Click "Add Item" to start building your list!</p>
            </CardContent>
          </Card>
        )}

        {appData.items.length > 0 && (
            <div className="mt-12">
                 <SummaryDashboard budgetData={appData.budget} items={displayItems} />
            </div>
        )}

        <PurchaseItemForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={editingItem ? handleEditItem : handleAddItem}
          initialData={editingItem}
          currencySymbol={appData.budget.currencySymbol}
        />
        <LogPaymentDialog
          isOpen={isLogPaymentModalOpen}
          onOpenChange={setIsLogPaymentModalOpen}
          itemBeingPaid={itemToLogPaymentFor}
          currencySymbol={appData.budget.currencySymbol}
          onSubmitLogPayment={handleLogPayment}
        />
      </main>
      <footer className="text-center py-6 border-t border-border text-sm text-muted-foreground">
        BuildMaster &copy; {new Date().getFullYear()} - Your Gaming PC Purchase Tracker
      </footer>
    </div>
  );
}
