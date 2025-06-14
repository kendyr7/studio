
"use client";

import type { SortConfig, FilterStatus, SortableField } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Filter } from "lucide-react";

interface SortFilterControlsProps {
  sortConfig: SortConfig;
  filterStatus: FilterStatus;
  onSortChange: (field: SortableField) => void;
  onFilterChange: (status: FilterStatus) => void;
}

const sortableFields: { value: SortableField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "totalPrice", label: "Total Price" },
  { value: "paidAmount", label: "Amount Paid" },
  { value: "status", label: "Status" },
  // { value: "estimatedCompletionDate", label: "Est. Completion" }, // Removed
];

const filterStatuses: { value: FilterStatus; label: string }[] = [
  { value: "All", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Partially Paid", label: "Partially Paid" },
  { value: "Paid", label: "Paid" },
];

export function SortFilterControls({ sortConfig, filterStatus, onSortChange, onFilterChange }: SortFilterControlsProps) {
  return (
    <div className="my-6 p-4 bg-card rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-4">
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
