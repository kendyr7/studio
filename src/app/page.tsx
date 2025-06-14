
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ExternalLink, AlertTriangle, Home, Edit } from "lucide-react";
import { Header } from "@/components/layout/Header";
import type { BuildList, StoredPurchaseItem } from "@/types";
import { APP_DATA_VERSION } from "@/lib/constants";
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
import { formatCurrency, enrichPurchaseItem } from '@/lib/utils';
import { db } from '@/lib/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  // collectionGroup, // Not used currently
  // getCountFromServer // Not used currently
} from 'firebase/firestore';

// Placeholder user ID. In a real app, this would come from Firebase Auth.
const PLACEHOLDER_USER_ID = "default-user";

export default function HomePage() {
  const [buildLists, setBuildLists] = useState<BuildList[]>([]);
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [listToDelete, setListToDelete] = useState<BuildList | null>(null);
  
  const [isEditListNameDialogOpen, setIsEditListNameDialogOpen] = useState(false);
  const [listToEditName, setListToEditName] = useState<BuildList | null>(null);
  const [editingListName, setEditingListName] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBuildLists = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "buildLists"),
          where("userId", "==", PLACEHOLDER_USER_ID),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const lists: BuildList[] = [];
        for (const docSnap of querySnapshot.docs) {
          const listData = docSnap.data();
          
          // Fetch items for each list to calculate overview stats
          // This is N+1, consider optimizing for many lists (e.g., aggregated fields in Firestore)
          // For now, prioritizing getting saves to work.
          const itemsColRef = collection(db, "buildLists", docSnap.id, "items");
          const itemsSnapshot = await getDocs(itemsColRef);
          const items = itemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as StoredPurchaseItem));

          lists.push({
            id: docSnap.id,
            name: listData.name,
            createdAt: (listData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            version: listData.version || APP_DATA_VERSION,
            budget: listData.budget || { totalBudget: 0, currencySymbol: "$" },
            userId: listData.userId,
            items: items, 
          });
        }
        setBuildLists(lists);
      } catch (error) {
        console.error("Error fetching build lists:", error);
        toast({ 
          title: "Error Fetching Lists", 
          description: `Could not fetch build lists. ${error instanceof Error ? error.message : String(error)}`, 
          variant: "destructive" 
        });
      }
      setIsLoading(false);
    };

    fetchBuildLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Removed buildLists from dependencies to prevent potential loops if not careful with updates

  const handleCreateNewList = async () => {
    if (!newListName.trim()) {
      toast({ title: "Error", description: "List name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const newListData = {
        name: newListName.trim(),
        createdAt: serverTimestamp(),
        version: APP_DATA_VERSION,
        budget: { totalBudget: 1500, currencySymbol: "$" },
        userId: PLACEHOLDER_USER_ID,
      };
      const docRef = await addDoc(collection(db, "buildLists"), newListData);
      
      const newUiList: BuildList = {
        id: docRef.id,
        name: newListData.name,
        createdAt: new Date().toISOString(), // Use current date for optimistic update
        version: newListData.version,
        budget: newListData.budget,
        userId: newListData.userId,
        items: [] 
      };
      setBuildLists(prev => [newUiList, ...prev]);

      setNewListName("");
      setIsCreateDialogOpen(false);
      toast({ title: "List Created", description: `"${newListData.name}" has been created.` });
    } catch (error) {
      console.error("Error creating new list:", error);
      toast({ 
        title: "Error Creating List", 
        description: `Could not create new list. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setIsLoading(false);
  };

  const handleDeleteList = async (listId: string) => {
    const list = buildLists.find(l => l.id === listId);
    if (!list) return;

    setIsLoading(true);
    try {
      // Note: Deleting subcollections in Firestore from the client-side is complex and often requires Firebase Functions.
      // This only deletes the main list document. Items subcollection will remain orphaned.
      await deleteDoc(doc(db, "buildLists", listId));
      setBuildLists(prev => prev.filter(l => l.id !== listId));
      toast({ title: "List Deleted", description: `"${list.name}" has been deleted. Items within the list are not automatically deleted.`, variant: "destructive" });
    } catch (error) {
      console.error("Error deleting list:", error);
      toast({ 
        title: "Error Deleting List", 
        description: `Could not delete list. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setListToDelete(null);
    setIsLoading(false);
  };

  const openEditListNameDialog = (list: BuildList) => {
    setListToEditName(list);
    setEditingListName(list.name);
    setIsEditListNameDialogOpen(true);
  };

  const handleUpdateListName = async () => {
    if (!listToEditName || !editingListName.trim()) {
      toast({ title: "Error", description: "List name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const listRef = doc(db, "buildLists", listToEditName.id);
      await updateDoc(listRef, { name: editingListName.trim() });
      
      setBuildLists(prev =>
        prev.map(l =>
          l.id === listToEditName.id ? { ...l, name: editingListName.trim() } : l
        )
      );
      toast({ title: "List Updated", description: `List name changed to "${editingListName.trim()}".` });
      setIsEditListNameDialogOpen(false);
      setListToEditName(null);
      setEditingListName("");
    } catch (error) {
      console.error("Error updating list name:", error);
      toast({ 
        title: "Error Updating Name", 
        description: `Could not update list name. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setIsLoading(false);
  };
  
  if (isLoading && buildLists.length === 0) { // Show loader only on initial load or during operations
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

        {buildLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildLists.map(list => {
              // Calculations for overview are done here using the items fetched earlier
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
                                  This action will permanently delete the build list "{listToDelete.name}". This cannot be undone, and items within the list may not be automatically deleted from the database by this action.
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
          !isLoading && ( // Only show "No lists" if not loading and lists are empty
            <Card className="col-span-full text-center py-12 shadow">
              <CardContent className="flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <p className="text-xl font-medium">No build lists found.</p>
                <p className="text-muted-foreground">Click "Create New List" to get started!</p>
              </CardContent>
            </Card>
          )
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
            <Button onClick={handleCreateNewList} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading && newListName ? "Creating..." : "Create List"}
            </Button>
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
            <Button onClick={handleUpdateListName} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading && listToEditName ? "Saving..." : "Save Name"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <footer className="text-center py-6 border-t border-border text-sm text-muted-foreground">
        BuildMaster &copy; {new Date().getFullYear()} - Your Gaming PC Purchase Tracker
      </footer>
    </div>
  );
}
