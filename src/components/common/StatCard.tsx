import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1 text-balance">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1 text-pretty">{description}</p>}
            {trend && <p className="text-xs text-success mt-1 font-medium">{trend}</p>}
          </div>
          <div className="shrink-0 p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
