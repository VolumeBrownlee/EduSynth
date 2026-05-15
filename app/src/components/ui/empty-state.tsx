import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tone } from './tone-pill';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'brand',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-10', className)}>
      <div
        className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
          `tone-bg-${tone}`,
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-emph font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-caption text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
