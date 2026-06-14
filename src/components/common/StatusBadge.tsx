import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AttendanceStatus, AssessmentStatus, HifzStatus, StudentStatus } from '@/types/types';

const statusConfig = {
  // Attendance
  present: { label: 'Present', className: 'bg-success/10 text-success border-success/30' },
  absent: { label: 'Absent', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  excused: { label: 'Excused', className: 'bg-warning/10 text-warning border-warning/30' },
  late: { label: 'Late', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  // Assessment
  draft: { label: 'Draft', className: 'bg-muted text-foreground border-border' },
  published: { label: 'Published', className: 'bg-info/10 text-info border-info/30' },
  reviewed: { label: 'Reviewed', className: 'bg-secondary text-secondary-foreground border-border' },
  results_published: { label: 'Results Published', className: 'bg-success/10 text-success border-success/30' },
  // Hifz
  not_started: { label: 'Not Started', className: 'bg-muted text-foreground border-border' },
  in_progress: { label: 'In Progress', className: 'bg-info/10 text-info border-info/30' },
  memorized: { label: 'Memorized', className: 'bg-success/10 text-success border-success/30' },
  needs_revision: { label: 'Needs Revision', className: 'bg-warning/10 text-warning border-warning/30' },
  // Student
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/30' },
  inactive: { label: 'Inactive', className: 'bg-muted text-foreground border-border' },
  graduated: { label: 'Graduated', className: 'bg-secondary text-secondary-foreground border-border' },
  // Generic
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/30' },
  submitted: { label: 'Submitted', className: 'bg-info/10 text-info border-info/30' },
  graded: { label: 'Graded', className: 'bg-secondary text-secondary-foreground border-border' },
};

type StatusKey = keyof typeof statusConfig;

interface StatusBadgeProps {
  status: StatusKey | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusKey] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={cn('border font-normal', config.className, className)}>
      {config.label}
    </Badge>
  );
}
