
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Import useRouter and useParams
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PurchaseItemForm, type PurchaseItemFormData } from "@/components/buildmaster/PurchaseItemForm";
import { PurchaseItemCard } from "@/components/buildmaster/PurchaseItemCard";
import { BudgetManager } from "@/components/buildmaster/BudgetManager";
import { SummaryDashboard } from "@/components/buildmaster/SummaryDashboard";
import { SortFilterControls } from "@/components/buildmaster/SortFilterControls";
import { LogPaymentDialog } from "@/components/buildmaster/LogPaymentDialog";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { AllBuilds, BuildList, StoredPurchaseItem, PurchaseItem as DisplayPurchaseItem, SortConfig, FilterStatus, SortableField, ItemStatus } from "@/types";
import { APP_DATA_VERSION, LOCAL_STORAGE_KEY_ALL_BUILDS } from "@/lib/constants";
import { enrichPurchaseItem } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';

const initialAllBuilds: AllBuilds = { lists: [] };

export default function BuildListPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;

  const [allBuilds, setAllBuilds] = useLocalStorage<AllBuilds>(LOCAL_STORAGE_KEY_ALL_BUILDS, initialAllBuilds);
  const { toast } = useToast();

  const [currentList, setCurrentList] = useState<BuildList | undefined>(undefined);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoredPurchaseItem | undefined>(undefined);
  
  const [isLogPaymentModalOpen, setIsLogPaymentModalOpen] = useState(false);
  const [itemToLogPaymentFor, setItemToLogPaymentFor] = useState<DisplayPurchaseItem | undefined>(undefined);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const foundList = allBuilds.lists.find(l => l.id === listId);
    if (foundList) {
      if (foundList.version !== APP_DATA_VERSION) {
        console.warn(`Data version mismatch for list "${foundList.name}". Expected ${APP_DATA_VERSION}, found ${foundList.version}. Consider migrating data.`);
        // Potentially add more sophisticated migration logic here if versions differ significantly
      }
      // Item structure migration logic (similar to what was in the old page.tsx)
      const migratedItems = foundList.items.map(item => {
        const oldItem = item as any; 
        let individualPayments = item.individualPayments;
        let numberOfPayments = item.numberOfPayments ?? 1;

        if (!individualPayments && typeof oldItem.paidAmount !== 'undefined') {
          individualPayments = Array(numberOfPayments).fill(0);
          if (oldItem.paymentsMade === 1 && numberOfPayments === 1 && oldItem.paidAmount > 0) {
            individualPayments[0] = oldItem.paidAmount;
          }
        } else if (individualPayments && individualPayments.length !== numberOfPayments) {
            const correctedPayments = Array(numberOfPayments).fill(0);
            for(let i=0; i< Math.min(individualPayments.length, correctedPayments.length); i++) {
                correctedPayments[i] = individualPayments[i];
            }
            individualPayments = correctedPayments;
        } else if (!individualPayments) {
            individualPayments = Array(numberOfPayments).fill(0);
        }
        
        return {
            ...item,
            numberOfPayments,
            individualPayments,
            paidAmount: undefined, 
            paymentsMade: undefined, 
          } as StoredPurchaseItem;
      });

      if (JSON.stringify(foundList.items) !== JSON.stringify(migratedItems)) {
         const updatedList = { ...foundList, items: migratedItems, version: APP_DATA_VERSION };
         setCurrentList(updatedList);
         setAllBuilds(prev => ({
           ...prev,
           lists: prev.lists.map(l => l.id === listId ? updatedList : l),
         }));
      } else {
        setCurrentList(foundList);
      }

    } else if (allBuilds.lists.length > 0 && listId) { 
      // If listId is present but not found, and other lists exist, redirect.
      // This can happen if a list was deleted or URL is invalid.
      // Check if listId is valid (not just any truthy string)
      console.warn(`List with ID ${listId} not found. Redirecting to home.`);
      router.push('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, allBuilds.lists, router]); // Removed setAllBuilds and toast from deps


  const updateCurrentList = useCallback((updater: (list: BuildList) => BuildList) => {
    setCurrentList(prevList => {
      if (!prevList) return undefined;
      const updatedList = updater(prevList);
      setAllBuilds(all => ({
        ...all,
        lists: all.lists.map(l => l.id === listId ? updatedList : l),
      }));
      return updatedList;
    });
  }, [listId, setAllBuilds]);


  const handleAddItem = (data: PurchaseItemFormData) => {
    if (!currentList) return;
    const newItem: StoredPurchaseItem = {
      id: crypto.randomUUID(),
      name: data.name,
      totalPrice: data.totalPrice,
      numberOfPayments: data.numberOfPayments,
      individualPayments: data.individualPayments.map(p => p || 0),
      notes: data.notes,
      includeInSpendCalculation: data.includeInSpendCalculation,
    };
    updateCurrentList(list => ({ ...list, items: [...list.items, newItem] }));
    toast({ title: "Item Added", description: `${data.name} has been added to your list.` });
  };

  const handleEditItem = (data: PurchaseItemFormData) => {
    if (!editingItem || !currentList) return;
    const updatedItem: StoredPurchaseItem = {
      ...editingItem,
      name: data.name,
      totalPrice: data.totalPrice,
      numberOfPayments: data.numberOfPayments,
      individualPayments: data.individualPayments.map(p => p || 0),
      notes: data.notes,
      includeInSpendCalculation: data.includeInSpendCalculation,
    };
    updateCurrentList(list => ({
      ...list,
      items: list.items.map(item => item.id === editingItem.id ? updatedItem : item),
    }));
    setEditingItem(undefined);
    toast({ title: "Item Updated", description: `${data.name} has been updated.` });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentList) return;
    const itemToDelete = currentList.items.find(item => item.id === itemId);
    updateCurrentList(list => ({ ...list, items: list.items.filter(item => item.id !== itemId) }));
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
    updateCurrentList(list => ({
      ...list,
      items: list.items.map(item =>
        item.id === itemId ? { ...item, includeInSpendCalculation: include } : item
      ),
    }));
  };

  const handleUpdateBudget = (newTotalBudget: number) => {
    if (!currentList) return;
    updateCurrentList(list => ({ ...list, budget: { ...list.budget, totalBudget: newTotalBudget } }));
    toast({ title: "Budget Updated", description: `Total budget set to ${currentList.budget.currencySymbol}${newTotalBudget.toFixed(2)}.` });
  };

  const handleUpdateCurrency = (newCurrencySymbol: string) => {
    if (!currentList) return;
    updateCurrentList(list => ({ ...list, budget: { ...list.budget, currencySymbol: newCurrencySymbol } }));
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
    if (!currentList) return;
    updateCurrentList(list => {
        const updatedItems = list.items.map(item => {
            if (item.id === itemId) {
              const newIndividualPayments = [...(item.individualPayments || Array(item.numberOfPayments || 1).fill(0))];
              let paymentLogged = false;
              for (let i = 0; i < newIndividualPayments.length; i++) {
                if ((newIndividualPayments[i] === 0 || newIndividualPayments[i] === undefined) && !paymentLogged) {
                  newIndividualPayments[i] = paymentAmount;
                  paymentLogged = true;
                  break; 
                }
              }
              
              if (paymentLogged) {
                let currentTotalPaid = newIndividualPayments.reduce((sum, p) => sum + (p || 0), 0);
                if (currentTotalPaid > item.totalPrice) {
                    const overPayment = currentTotalPaid - item.totalPrice;
                    // Find the index of the payment we just logged
                    const lastLoggedPaymentIndex = newIndividualPayments.findIndex((p, idx, arr) => {
                        if (p === paymentAmount) {
                            // Check if this is the first occurrence of paymentAmount from the end, essentially finding the last one added.
                            // This logic is a bit naive if multiple payments of the exact same amount are made.
                            // A more robust way would be to track the specific index being paid.
                            // For now, this assumes the paymentAmount is unique or we adjust the latest.
                            let count = 0;
                            for (let k=idx; k<arr.length; k++) if(arr[k] === paymentAmount) count++;
                            return count === 1; 
                        }
                        return false;
                    });


                     if (lastLoggedPaymentIndex !== -1) {
                        newIndividualPayments[lastLoggedPaymentIndex] = Math.max(0, paymentAmount - overPayment);
                     } else {
                        // Fallback: if we can't find the exact payment to adjust, adjust the last non-zero payment.
                        for (let i = newIndividualPayments.length - 1; i >=0; i--) {
                            if (newIndividualPayments[i] > 0) {
                                newIndividualPayments[i] = Math.max(0, newIndividualPayments[i] - overPayment);
                                break;
                            }
                        }
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
        return { ...list, items: updatedItems };
    });
    const itemData = currentList.items.find(i => i.id === itemId);
    if (itemData) {
      toast({ title: "Payment Logged", description: `Payment of ${currentList.budget.currencySymbol}${paymentAmount.toFixed(2)} logged for ${itemData.name}.` });
    }
    setIsLogPaymentModalOpen(false);
  }, [currentList, updateCurrentList, toast]);


  const displayItems: DisplayPurchaseItem[] = useMemo(() => {
    if (!currentList) return [];
    let items = currentList.items.map(item => {
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

    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    items.sort((a, b) => {
      let valA = a[sortConfig.field];
      let valB = b[sortConfig.field];

      if (sortConfig.field === 'status') {
        const statusOrder: Record<ItemStatus, number> = { 'Pending': 1, 'Partially Paid': 2, 'Paid': 3 };
        valA = statusOrder[a.status];
        valB = statusOrder[b.status];
      } else if (sortConfig.field === 'paidAmount') { 
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
  }, [currentList, filterStatus, sortConfig, searchTerm]);


  if (!isClient || !currentList) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
            <div className="flex items-center space-x-2">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl font-headline">Loading Build List...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-6">
            <Link href="/" passHref>
                <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Lists
                </Button>
            </Link>
        </div>

        <h1 className="text-4xl font-headline text-center mb-2 text-primary">{currentList.name}</h1>
        <p className="text-center text-muted-foreground mb-8">Manage components and budget for this build.</p>


        <BudgetManager
          budgetData={currentList.budget}
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
          searchTerm={searchTerm}
          onSortChange={handleSortChange}
          onFilterChange={setFilterStatus}
          onSearchChange={setSearchTerm}
        />
        
        {displayItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayItems.map(item => (
              <PurchaseItemCard
                key={item.id}
                item={item}
                onEdit={() => openEditForm(currentList.items.find(i => i.id === item.id)!)}
                onDelete={handleDeleteItem}
                onToggleIncludeInSpend={handleToggleIncludeInSpend}
                onOpenLogPaymentModal={openLogPaymentModal}
                currencySymbol={currentList.budget.currencySymbol}
              />
            ))}
          </div>
        ) : (
           <Card className="col-span-full text-center py-12 shadow">
            <CardContent className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />
              <p className="text-xl font-medium">No components found for this list.</p>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search or filter criteria." : "Click \"Add Item\" to start building your list!"}
              </p>
            </CardContent>
          </Card>
        )}

        {currentList.items.length > 0 && (
            <div className="mt-12">
                 <SummaryDashboard budgetData={currentList.budget} items={displayItems} />
            </div>
        )}

        <PurchaseItemForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={editingItem ? handleEditItem : handleAddItem}
          initialData={editingItem}
          currencySymbol={currentList.budget.currencySymbol}
        />
        <LogPaymentDialog
          isOpen={isLogPaymentModalOpen}
          onOpenChange={setIsLogPaymentModalOpen}
          itemBeingPaid={itemToLogPaymentFor}
          currencySymbol={currentList.budget.currencySymbol}
          onSubmitLogPayment={handleLogPayment}
        />
      </main>
      <footer className="text-center py-6 border-t border-border text-sm text-muted-foreground">
        BuildMaster &copy; {new Date().getFullYear()} - Your Gaming PC Purchase Tracker
      </footer>
    </div>
  );
}

