
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ExternalLink, AlertTriangle, Home, Edit, Loader2 } from "lucide-react";
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
  writeBatch,
} from 'firebase/firestore';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [buildLists, setBuildLists] = useState<BuildList[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [listToDelete, setListToDelete] = useState<BuildList | null>(null);
  
  const [isEditListNameDialogOpen, setIsEditListNameDialogOpen] = useState(false);
  const [listToEditName, setListToEditName] = useState<BuildList | null>(null);
  const [editingListName, setEditingListName] = useState("");
  
  const [isLoadingData, setIsLoadingData] = useState(true); // For data fetching specifically

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve
    if (!user) {
      router.push('/auth');
      return;
    }

    const fetchBuildLists = async () => {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const q = query(
          collection(db, "buildLists"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const listsPromises = querySnapshot.docs.map(async (docSnap) => {
          const listData = docSnap.data();
          const itemsColRef = collection(db, "buildLists", docSnap.id, "items");
          const itemsSnapshot = await getDocs(itemsColRef);
          const items = itemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as StoredPurchaseItem));

          return {
            id: docSnap.id,
            name: listData.name,
            createdAt: (listData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            version: listData.version || APP_DATA_VERSION,
            budget: listData.budget || { totalBudget: 0, currencySymbol: "$" },
            userId: listData.userId,
            items: items, 
          } as BuildList;
        });
        const lists = await Promise.all(listsPromises);
        setBuildLists(lists);
      } catch (error) {
        console.error("Error fetching build lists:", error);
        toast({ 
          title: "Error Fetching Lists", 
          description: `Could not fetch build lists. ${error instanceof Error ? error.message : String(error)}`, 
          variant: "destructive" 
        });
      }
      setIsLoadingData(false);
    };

    fetchBuildLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]); // toast removed

  const handleCreateNewList = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a list.", variant: "destructive" });
      return;
    }
    if (!newListName.trim()) {
      toast({ title: "Error", description: "List name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoadingData(true);
    try {
      const newListData = {
        name: newListName.trim(),
        createdAt: serverTimestamp(),
        version: APP_DATA_VERSION,
        budget: { totalBudget: 1500, currencySymbol: "$" },
        userId: user.uid,
      };
      const docRef = await addDoc(collection(db, "buildLists"), newListData);
      
      const newUiList: BuildList = {
        id: docRef.id,
        name: newListData.name,
        createdAt: new Date().toISOString(), 
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
    setIsLoadingData(false);
  };

  const handleDeleteList = async (listId: string) => {
    const list = buildLists.find(l => l.id === listId);
    if (!list) return;

    setIsLoadingData(true);
    try {
      // Delete all items in the subcollection first
      const itemsColRef = collection(db, "buildLists", listId, "items");
      const itemsSnapshot = await getDocs(itemsColRef);
      const batch = writeBatch(db);
      itemsSnapshot.docs.forEach(itemDoc => {
        batch.delete(itemDoc.ref);
      });
      await batch.commit();

      // Then delete the list document
      await deleteDoc(doc(db, "buildLists", listId));
      setBuildLists(prev => prev.filter(l => l.id !== listId));
      toast({ title: "List Deleted", description: `"${list.name}" and all its items have been deleted.`, variant: "destructive" });
    } catch (error) {
      console.error("Error deleting list:", error);
      toast({ 
        title: "Error Deleting List", 
        description: `Could not delete list. ${error instanceof Error ? error.message : String(error)}`, 
        variant: "destructive" 
      });
    }
    setListToDelete(null);
    setIsLoadingData(false);
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
    setIsLoadingData(true);
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
    setIsLoadingData(false);
  };
  
  if (authLoading || (isLoadingData && !user)) { 
     return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
            <div className="flex items-center space-x-2">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <p className="text-xl font-headline">Loading BuildMaster...</p>
            </div>
        </div>
    );
  }
  
  if (!user) { // Should be caught by useEffect redirect, but as a fallback
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
             <p className="text-xl font-headline">Redirecting to login...</p>
        </div>
      );
  }


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-headline text-primary flex items-center"><Home className="mr-3 h-8 w-8" /> My Build Lists</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoadingData}>
            <PlusCircle className="mr-2 h-5 w-5" /> Create New List
          </Button>
        </div>

        {isLoadingData && buildLists.length === 0 ? (
             <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <p className="ml-2 text-xl font-headline">Fetching lists...</p>
            </div>
        ) : buildLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildLists.map(list => {
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
                        <Button variant="outline" size="icon" onClick={() => openEditListNameDialog(list)} aria-label="Edit list name" disabled={isLoadingData}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); setListToDelete(list); }} aria-label="Delete list" disabled={isLoadingData}>
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
                                <AlertDialogAction onClick={() => handleDeleteList(listToDelete.id)} disabled={isLoadingData}>
                                    {isLoadingData ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null} Delete List
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
                      </div>
                      <Link href={`/build/${list.id}`} passHref className="flex-grow ml-2">
                        <Button variant="outline" size="sm" className="w-full" disabled={isLoadingData}>
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
          !isLoadingData && ( 
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
                <Button type="button" variant="secondary" disabled={isLoadingData}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateNewList} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingData || !newListName.trim()}>
              {isLoadingData && newListName.trim() ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
              Create List
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
                <Button type="button" variant="secondary" onClick={() => { setIsEditListNameDialogOpen(false); setListToEditName(null); setEditingListName(""); }} disabled={isLoadingData}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateListName} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingData || !editingListName.trim()}>
              {isLoadingData && listToEditName ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
              Save Name
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
