
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PurchaseItemForm, type PurchaseItemFormData } from "@/components/buildmaster/PurchaseItemForm";
import { PurchaseItemCard } from "@/components/buildmaster/PurchaseItemCard";
import { BudgetManager } from "@/components/buildmaster/BudgetManager";
import { SummaryDashboard } from "@/components/buildmaster/SummaryDashboard";
import { SortFilterControls } from "@/components/buildmaster/SortFilterControls";
import { LogPaymentDialog } from "@/components/buildmaster/LogPaymentDialog";
import type { BuildList, StoredPurchaseItem, PurchaseItem as DisplayPurchaseItem, SortConfig, FilterStatus, SortableField, ItemStatus } from "@/types";
import { APP_DATA_VERSION } from "@/lib/constants";
import { enrichPurchaseItem } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { db } from '@/lib/firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  // writeBatch, // Not used currently
  Timestamp,
  // serverTimestamp, // Not used for item creation timestamp, relies on list's serverTimestamp
  orderBy,
  query,
} from 'firebase/firestore';

// Placeholder user ID. In a real app, this would come from Firebase Auth.
const PLACEHOLDER_USER_ID = "default-user";

export default function BuildListPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;

  const { toast } = useToast();

  const [currentList, setCurrentList] = useState<BuildList | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false); // For individual operations

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoredPurchaseItem | undefined>(undefined);
  
  const [isLogPaymentModalOpen, setIsLogPaymentModalOpen] = useState(false);
  const [itemToLogPaymentFor, setItemToLogPaymentFor] = useState<DisplayPurchaseItem | undefined>(undefined);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  useEffect(() => {
    if (!listId) {
      toast({ title: "Invalid List ID", description: "No list ID provided.", variant: "destructive" });
      router.push('/');
      return;
    }

    const fetchListAndItems = async () => {
      setIsLoading(true);
      try {
        const listDocRef = doc(db, "buildLists", listId);
        const listDocSnap = await getDoc(listDocRef);

        if (listDocSnap.exists()) {
          const listData = listDocSnap.data();
          if (listData.userId !== PLACEHOLDER_USER_ID) { // Basic security check
            toast({ title: "Access Denied", description: "You do not have permission to view this list.", variant: "destructive" });
            router.push('/');
            return;
          }

          const itemsColRef = collection(db, "buildLists", listId, "items");
          const itemsQuery = query(itemsColRef, orderBy("name")); // Default sort by name, can be adjusted
          const itemsSnapshot = await getDocs(itemsQuery);
          const items = itemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as StoredPurchaseItem));
          
          let listToSet: BuildList = {
            id: listDocSnap.id,
            name: listData.name,
            createdAt: (listData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            version: listData.version || APP_DATA_VERSION,
            budget: listData.budget || { totalBudget: 0, currencySymbol: "$" },
            userId: listData.userId,
            items: items,
          };
          
          if (listToSet.version !== APP_DATA_VERSION) {
            console.warn(`Data version mismatch for list "${listToSet.name}". Expected ${APP_DATA_VERSION}, found ${listToSet.version}. Consider migration.`);
             try {
                await updateDoc(listDocRef, { version: APP_DATA_VERSION });
                listToSet.version = APP_DATA_VERSION;
             } catch (e) {
                console.error("Failed to update list version in Firestore", e);
                // Non-critical, proceed with loaded data
             }
          }
          setCurrentList(listToSet);

        } else {
          toast({ title: "Not Found", description: "Build list not found.", variant: "destructive" });
          router.push('/');
        }
      } catch (error) {
        console.error("Error fetching build list:", error);
        toast({ 
            title: "Error Fetching List", 
            description: `Could not fetch build list data. ${error instanceof Error ? error.message : String(error)}`, 
            variant: "destructive" 
        });
        router.push('/');
      }
      setIsLoading(false);
    };

    fetchListAndItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, router]); // toast removed as it's stable


  const handleAddItem = async (data: PurchaseItemFormData) => {
    if (!currentList) return;
    setIsOperating(true);
    const newItemData: Omit<StoredPurchaseItem, 'id'> = {
      name: data.name,
      totalPrice: data.totalPrice,
      numberOfPayments: data.numberOfPayments,
      individualPayments: Array(data.numberOfPayments).fill(0).map((_,i) => data.individualPayments[i] || 0),
      notes: data.notes || "",
      includeInSpendCalculation: data.includeInSpendCalculation,
    };
    try {
      const itemsColRef = collection(db, "buildLists", currentList.id, "items");
      const docRef = await addDoc(itemsColRef, newItemData);
      
      const addedItemWithId: StoredPurchaseItem = { ...newItemData, id: docRef.id };
      setCurrentList(prev => prev ? { ...prev, items: [...prev.items, addedItemWithId].sort((a,b) => a.name.localeCompare(b.name)) } : undefined);
      toast({ title: "Item Added", description: `${data.name} has been added.` });
    } catch (error) {
      console.error("Error adding item:", error);
      toast({ 
        title: "Error Adding Item", 
        description: `Could not add item. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setIsOperating(false);
  };

  const handleEditItem = async (data: PurchaseItemFormData) => {
    if (!editingItem || !currentList) return;
    setIsOperating(true);
    const itemDocRef = doc(db, "buildLists", currentList.id, "items", editingItem.id);
    const updatedItemData: Omit<StoredPurchaseItem, 'id'> = {
      name: data.name,
      totalPrice: data.totalPrice,
      numberOfPayments: data.numberOfPayments,
      individualPayments: Array(data.numberOfPayments).fill(0).map((_,i) => data.individualPayments[i] || 0),
      notes: data.notes || "",
      includeInSpendCalculation: data.includeInSpendCalculation,
    };
    try {
      await updateDoc(itemDocRef, updatedItemData);
      setCurrentList(prev => {
        if (!prev) return undefined;
        return {
          ...prev,
          items: prev.items.map(item => item.id === editingItem.id ? { ...updatedItemData, id: editingItem.id } : item)
                           .sort((a,b) => a.name.localeCompare(b.name)),
        };
      });
      setEditingItem(undefined);
      toast({ title: "Item Updated", description: `${data.name} has been updated.` });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({ 
        title: "Error Updating Item", 
        description: `Could not update item. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setIsOperating(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!currentList) return;
    const itemToDelete = currentList.items.find(item => item.id === itemId);
    if (!itemToDelete) return;
    
    setIsOperating(true);
    const itemDocRef = doc(db, "buildLists", currentList.id, "items", itemId);
    try {
      await deleteDoc(itemDocRef);
      setCurrentList(prev => prev ? { ...prev, items: prev.items.filter(item => item.id !== itemId) } : undefined);
      toast({ title: "Item Deleted", description: `${itemToDelete.name} has been removed.`, variant: "destructive" });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ 
        title: "Error Deleting Item", 
        description: `Could not delete item. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setIsOperating(false);
  };

  const openEditForm = (item: StoredPurchaseItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };
  
  const handleToggleIncludeInSpend = async (itemId: string, include: boolean) => {
     if (!currentList) return;
    setIsOperating(true);
    const itemDocRef = doc(db, "buildLists", currentList.id, "items", itemId);
    try {
        await updateDoc(itemDocRef, { includeInSpendCalculation: include });
        setCurrentList(prev => {
            if (!prev) return undefined;
            return {
                ...prev,
                items: prev.items.map(item => item.id === itemId ? { ...item, includeInSpendCalculation: include } : item)
            };
        });
    } catch (error) {
        console.error("Error toggling include in spend:", error);
        toast({ 
            title: "Error Updating Preference", 
            description: `Could not update item preference. ${error instanceof Error ? error.message : String(error)}`, 
            variant: "destructive" 
        });
    }
    setIsOperating(false);
  };

  const handleUpdateBudget = async (newTotalBudget: number) => {
    if (!currentList) return;
    setIsOperating(true);
    const listDocRef = doc(db, "buildLists", currentList.id);
    try {
      await updateDoc(listDocRef, { "budget.totalBudget": newTotalBudget });
      setCurrentList(prev => prev ? { ...prev, budget: { ...prev.budget, totalBudget: newTotalBudget } } : undefined);
      toast({ title: "Budget Updated", description: `Total budget set to ${currentList.budget.currencySymbol}${newTotalBudget.toFixed(2)}.` });
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({ 
        title: "Error Updating Budget", 
        description: `Could not update budget. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setIsOperating(false);
  };

  const handleUpdateCurrency = async (newCurrencySymbol: string) => {
    if (!currentList) return;
    setIsOperating(true);
    const listDocRef = doc(db, "buildLists", currentList.id);
    try {
      await updateDoc(listDocRef, { "budget.currencySymbol": newCurrencySymbol });
      setCurrentList(prev => prev ? { ...prev, budget: { ...prev.budget, currencySymbol: newCurrencySymbol } } : undefined);
      toast({ title: "Currency Updated", description: `Currency symbol set to ${newCurrencySymbol}.` });
    } catch (error) {
      console.error("Error updating currency:", error);
      toast({ 
        title: "Error Updating Currency", 
        description: `Could not update currency. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setIsOperating(false);
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

  const handleLogPayment = useCallback(async (itemId: string, paymentAmount: number) => {
    if (!currentList) return;
    const itemToUpdate = currentList.items.find(item => item.id === itemId);
    if (!itemToUpdate) return;

    setIsOperating(true);
    const itemDocRef = doc(db, "buildLists", currentList.id, "items", itemId);
    
    const newIndividualPayments = [...(itemToUpdate.individualPayments || Array(itemToUpdate.numberOfPayments || 1).fill(0))];
    let paymentLogged = false;
    for (let i = 0; i < newIndividualPayments.length; i++) {
      if ((newIndividualPayments[i] === 0 || newIndividualPayments[i] === undefined) && !paymentLogged) {
        newIndividualPayments[i] = paymentAmount;
        paymentLogged = true;
        break; 
      }
    }

    if (!paymentLogged) {
        toast({ title: "Error", description: "No available payment slot to log this amount. All planned payments might be logged.", variant: "destructive" });
        setIsOperating(false);
        return;
    }
    
    let currentTotalPaid = newIndividualPayments.reduce((sum, p) => sum + (p || 0), 0);
    if (currentTotalPaid > itemToUpdate.totalPrice) {
        const overPayment = currentTotalPaid - itemToUpdate.totalPrice;
        const lastLoggedPaymentIndex = newIndividualPayments.lastIndexOf(paymentAmount);
        if (lastLoggedPaymentIndex !== -1) {
            newIndividualPayments[lastLoggedPaymentIndex] = Math.max(0, paymentAmount - overPayment);
        }
    }

    try {
        await updateDoc(itemDocRef, { individualPayments: newIndividualPayments });
        setCurrentList(prev => {
            if (!prev) return undefined;
            return {
                ...prev,
                items: prev.items.map(item => item.id === itemId ? { ...item, individualPayments: newIndividualPayments } : item)
            };
        });
        toast({ title: "Payment Logged", description: `Payment of ${currentList.budget.currencySymbol}${paymentAmount.toFixed(2)} logged for ${itemToUpdate.name}.` });
        setIsLogPaymentModalOpen(false);
    } catch (error) {
        console.error("Error logging payment:", error);
        toast({ 
            title: "Error Logging Payment", 
            description: `Could not log payment. ${error instanceof Error ? error.message : String(error)}`, 
            variant: "destructive" 
        });
    }
    setIsOperating(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentList, toast]);


  const displayItems: DisplayPurchaseItem[] = useMemo(() => {
    if (!currentList) return [];
    let items = currentList.items.map(item => enrichPurchaseItem(item));

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


  if (isLoading || !currentList) {
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
          <Button onClick={openAddForm} variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isOperating}>
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
                disabled={isOperating}
              />
            ))}
          </div>
        ) : (
           !isOperating && ( // Only show if not operating and no items
            <Card className="col-span-full text-center py-12 shadow">
                <CardContent className="flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <p className="text-xl font-medium">No components found for this list.</p>
                <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search or filter criteria." : "Click \"Add Item\" to start building your list!"}
                </p>
                </CardContent>
            </Card>
           )
        )}
        
        {isOperating && displayItems.length === 0 && ( // Show loader if operating and no items to display
             <div className="col-span-full flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                 <p className="ml-2 text-xl font-headline">Processing...</p>
            </div>
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
          isOperating={isOperating}
        />
        {itemToLogPaymentFor && (
          <LogPaymentDialog
            isOpen={isLogPaymentModalOpen}
            onOpenChange={setIsLogPaymentModalOpen}
            itemBeingPaid={itemToLogPaymentFor}
            currencySymbol={currentList.budget.currencySymbol}
            onSubmitLogPayment={handleLogPayment}
            isOperating={isOperating}
          />
        )}
      </main>
      <footer className="text-center py-6 border-t border-border text-sm text-muted-foreground">
        BuildMaster &copy; {new Date().getFullYear()} - Your Gaming PC Purchase Tracker
      </footer>
    </div>
  );
}
