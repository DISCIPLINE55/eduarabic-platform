import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6', className)}>
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1 text-pretty">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
