
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ExternalLink, AlertTriangle, Home, Edit } from "lucide-react"; // Added Edit icon
import { Header } from "@/components/layout/Header";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { AllBuilds, BuildList, BuildListData, StoredPurchaseItem as OldStoredPurchaseItem, BudgetData as OldBudgetData } from "@/types";
import { APP_DATA_VERSION, LOCAL_STORAGE_KEY_ALL_BUILDS, OLD_LOCAL_STORAGE_KEY } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, enrichPurchaseItem } from '@/lib/utils'; // Added enrichPurchaseItem

interface OldAppData {
  version: string;
  budget: OldBudgetData;
  items: OldStoredPurchaseItem[];
}

const initialAllBuilds: AllBuilds = {
  lists: [],
};

export default function HomePage() {
  const [allBuilds, setAllBuilds] = useLocalStorage<AllBuilds>(LOCAL_STORAGE_KEY_ALL_BUILDS, initialAllBuilds);
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [listToDelete, setListToDelete] = useState<BuildList | null>(null);
  
  const [isEditListNameDialogOpen, setIsEditListNameDialogOpen] = useState(false);
  const [listToEditName, setListToEditName] = useState<BuildList | null>(null);
  const [editingListName, setEditingListName] = useState("");
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const oldDataRaw = typeof window !== 'undefined' ? window.localStorage.getItem(OLD_LOCAL_STORAGE_KEY) : null;
    const newDataRaw = typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_STORAGE_KEY_ALL_BUILDS) : null;

    if (oldDataRaw && !newDataRaw) {
      try {
        const oldData: OldAppData = JSON.parse(oldDataRaw);
        if (oldData && oldData.items && oldData.budget) {
          
          const migratedItems = oldData.items.map(item => {
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
                id: item.id,
                name: item.name,
                totalPrice: item.totalPrice ?? 0,
                notes: item.notes,
                numberOfPayments: numberOfPayments,
                individualPayments: individualPayments,
                includeInSpendCalculation: item.includeInSpendCalculation ?? true,
              } as OldStoredPurchaseItem;
          });

          const migratedList: BuildList = {
            id: crypto.randomUUID(),
            name: "My Migrated Build",
            createdAt: new Date().toISOString(),
            version: APP_DATA_VERSION,
            budget: oldData.budget,
            items: migratedItems,
          };
          setAllBuilds({ lists: [migratedList] });
          if (typeof window !== 'undefined') window.localStorage.removeItem(OLD_LOCAL_STORAGE_KEY);
          toast({ title: "Data Migrated", description: "Your previous build has been moved to a new list." });
        }
      } catch (error) {
        console.error("Error migrating old data:", error);
        toast({ title: "Migration Error", description: "Could not automatically migrate your old build data.", variant: "destructive" });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleCreateNewList = () => {
    if (!newListName.trim()) {
      toast({ title: "Error", description: "List name cannot be empty.", variant: "destructive" });
      return;
    }
    const newListData: BuildListData = {
      version: APP_DATA_VERSION,
      budget: { totalBudget: 1500, currencySymbol: "$" },
      items: [],
    };
    const newList: BuildList = {
      ...newListData,
      id: crypto.randomUUID(),
      name: newListName.trim(),
      createdAt: new Date().toISOString(),
    };
    setAllBuilds(prev => ({ lists: [...prev.lists, newList] }));
    setNewListName("");
    setIsCreateDialogOpen(false);
    toast({ title: "List Created", description: `"${newList.name}" has been created.` });
  };

  const handleDeleteList = (listId: string) => {
    const list = allBuilds.lists.find(l => l.id === listId);
    if (list) {
      setAllBuilds(prev => ({ lists: prev.lists.filter(l => l.id !== listId) }));
      toast({ title: "List Deleted", description: `"${list.name}" has been deleted.`, variant: "destructive" });
    }
    setListToDelete(null);
  };

  const openEditListNameDialog = (list: BuildList) => {
    setListToEditName(list);
    setEditingListName(list.name);
    setIsEditListNameDialogOpen(true);
  };

  const handleUpdateListName = () => {
    if (!listToEditName || !editingListName.trim()) {
      toast({ title: "Error", description: "List name cannot be empty.", variant: "destructive" });
      return;
    }
    setAllBuilds(prev => ({
      ...prev,
      lists: prev.lists.map(l =>
        l.id === listToEditName.id ? { ...l, name: editingListName.trim() } : l
      ),
    }));
    toast({ title: "List Updated", description: `List name changed to "${editingListName.trim()}".` });
    setIsEditListNameDialogOpen(false);
    setListToEditName(null);
    setEditingListName("");
  };
  
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-headline text-primary flex items-center"><Home className="mr-3 h-8 w-8" /> My Build Lists</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New List
          </Button>
        </div>

        {allBuilds.lists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBuilds.lists.map(list => {
              const enrichedItems = list.items.map(item => enrichPurchaseItem(item));
              const totalPaidForList = enrichedItems.reduce((sum, item) => sum + item.paidAmount, 0);
              const totalRemainingForList = enrichedItems.reduce((sum, item) => sum + item.remainingBalance, 0);

              return (
                <Card key={list.id} className="flex flex-col shadow-lg hover:shadow-primary/30 transition-shadow duration-300 ease-in-out">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">{list.name}</CardTitle>
                    <CardDescription>Created: {new Date(list.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-1">
                    <p>Items: {list.items.length}</p>
                    <p>Budget: {formatCurrency(list.budget.totalBudget, list.budget.currencySymbol)}</p>
                    <p className="text-sm text-green-500">Total Paid: {formatCurrency(totalPaidForList, list.budget.currencySymbol)}</p>
                    <p className="text-sm text-orange-500">Total Remaining: {formatCurrency(totalRemainingForList, list.budget.currencySymbol)}</p>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="flex w-full justify-between items-center gap-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditListNameDialog(list)} aria-label="Edit list name">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); setListToDelete(list); }} aria-label="Delete list">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          {listToDelete && listToDelete.id === list.id && (
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will permanently delete the build list "{listToDelete.name}" and all its items. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setListToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteList(listToDelete.id)}>Delete List</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
                      </div>
                      <Link href={`/build/${list.id}`} passHref className="flex-grow ml-2">
                        <Button variant="outline" size="sm" className="w-full">
                          View List <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="col-span-full text-center py-12 shadow">
            <CardContent className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />
              <p className="text-xl font-medium">No build lists found.</p>
              <p className="text-muted-foreground">Click "Create New List" to get started!</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Build List</DialogTitle>
            <DialogDescription>Enter a name for your new PC build list.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Dream Gaming Rig"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewList()}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateNewList} className="bg-primary hover:bg-primary/90 text-primary-foreground">Create List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditListNameDialogOpen} onOpenChange={setIsEditListNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List Name</DialogTitle>
            <DialogDescription>Enter a new name for this build list.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Upgraded Streaming PC"
              value={editingListName}
              onChange={(e) => setEditingListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateListName()}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => { setIsEditListNameDialogOpen(false); setListToEditName(null); setEditingListName(""); }}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateListName} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Name</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <footer className="text-center py-6 border-t border-border text-sm text-muted-foreground">
        BuildMaster &copy; {new Date().getFullYear()} - Your Gaming PC Purchase Tracker
      </footer>
    </div>
  );
}

