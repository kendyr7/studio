
"use client";

import type { SortConfig, FilterStatus, SortableField } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Filter, Search } from "lucide-react";

interface SortFilterControlsProps {
  sortConfig: SortConfig;
  filterStatus: FilterStatus;
  searchTerm: string;
  onSortChange: (field: SortableField) => void;
  onFilterChange: (status: FilterStatus) => void;
  onSearchChange: (term: string) => void;
}

const sortableFields: { value: SortableField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "totalPrice", label: "Total Price" },
  { value: "paidAmount", label: "Amount Paid" },
  { value: "status", label: "Status" },
];

const filterStatuses: { value: FilterStatus; label: string }[] = [
  { value: "All", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Partially Paid", label: "Partially Paid" },
  { value: "Paid", label: "Paid" },
];

export function SortFilterControls({ 
  sortConfig, 
  filterStatus, 
  searchTerm,
  onSortChange, 
  onFilterChange,
  onSearchChange
}: SortFilterControlsProps) {
  return (
    <div className="my-6 p-4 bg-card rounded-lg shadow flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4">
      <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 lg:flex-none lg:w-[220px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full"
            aria-label="Search components by name"
        />
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <ArrowDownUp className="h-5 w-5 text-primary" />
        <Select
          value={sortConfig.field}
          onValueChange={(value) => onSortChange(value as SortableField)}
        >
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Sort by field">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortableFields.map(field => (
              <SelectItem key={field.value} value={field.value}>{field.label} ({sortConfig.field === field.value ? sortConfig.direction : 'asc'})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Filter className="h-5 w-5 text-primary" />
        <Select
          value={filterStatus}
          onValueChange={(value) => onFilterChange(value as FilterStatus)}
        >
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            {filterStatuses.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
