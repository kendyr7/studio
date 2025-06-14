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
import useLocalStorage from "@/hooks/useLocalStorage";
import type { StoredPurchaseItem, PurchaseItem as DisplayPurchaseItem, BudgetData, AppData, SortConfig, FilterStatus, SortableField, ItemStatus } from "@/types";
import { APP_DATA_VERSION, LOCAL_STORAGE_KEY } from "@/lib/constants";
import { enrichPurchaseItem, calculateItemStatus } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';

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

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    // Version check / migration logic could go here
    if (appData.version !== APP_DATA_VERSION) {
        // For now, just log. Could implement migration or reset.
        console.warn(`Data version mismatch. Expected ${APP_DATA_VERSION}, found ${appData.version}. Consider migrating data.`);
        // Example: setAppData({...initialAppData, budget: appData.budget }); // Keep budget, reset items
    }
  }, [appData.version]);


  const handleAddItem = (data: PurchaseItemFormData) => {
    const newItem: StoredPurchaseItem = {
      id: crypto.randomUUID(),
      ...data,
      estimatedCompletionDate: data.estimatedCompletionDate ? format(data.estimatedCompletionDate, 'yyyy-MM-dd') : undefined,
    };
    setAppData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    toast({ title: "Item Added", description: `${data.name} has been added to your list.` });
  };

  const handleEditItem = (data: PurchaseItemFormData) => {
    if (!editingItem) return;
    const updatedItem: StoredPurchaseItem = {
      ...editingItem,
      ...data,
      estimatedCompletionDate: data.estimatedCompletionDate ? format(data.estimatedCompletionDate, 'yyyy-MM-dd') : undefined,
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

  const displayItems: DisplayPurchaseItem[] = useMemo(() => {
    let items = appData.items.map(enrichPurchaseItem);

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
      } else if (sortConfig.field === 'estimatedCompletionDate') {
        // Handle undefined dates: sort them to the end
        const dateA = a.estimatedCompletionDate ? parseISO(a.estimatedCompletionDate).getTime() : Infinity;
        const dateB = b.estimatedCompletionDate ? parseISO(b.estimatedCompletionDate).getTime() : Infinity;
        valA = dateA;
        valB = dateB;
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
    // Render a loading state or null during SSR to avoid hydration mismatch
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
      </main>
      <footer className="text-center py-6 border-t border-border text-sm text-muted-foreground">
        BuildMaster &copy; {new Date().getFullYear()} - Your Gaming PC Purchase Tracker
      </footer>
    </div>
  );
}
