import type { ItemStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { CircleAlert, Activity, CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemStatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

const statusConfig: Record<ItemStatus, { Icon: LucideIcon; colorClass: string; label: string }> = {
  Pending: { Icon: CircleAlert, colorClass: 'bg-destructive/80 hover:bg-destructive/70 border-destructive text-destructive-foreground', label: 'Pending' },
  'Partially Paid': { Icon: Activity, colorClass: 'bg-yellow-500/80 hover:bg-yellow-500/70 border-yellow-500 text-black', label: 'Partially Paid' },
  Paid: { Icon: CheckCircle2, colorClass: 'bg-green-600/80 hover:bg-green-600/70 border-green-600 text-primary-foreground', label: 'Paid' },
};

export function ItemStatusBadge({ status, className }: ItemStatusBadgeProps) {
  const { Icon, colorClass, label } = statusConfig[status] || statusConfig.Pending;

  return (
    <Badge variant="outline" className={cn("text-xs font-medium gap-1.5", colorClass, className)} aria-label={`Status: ${label}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
