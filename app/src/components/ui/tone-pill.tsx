import * as React from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'brand' | 'energy' | 'arcane' | 'triumph' | 'danger' | 'success' | 'neutral';

interface TonePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const sizeMap = {
  sm: 'h-5 px-1.5 gap-1 text-micro',
  md: 'h-6 px-2 gap-1.5 text-caption',
};

export function TonePill({
  tone = 'neutral',
  size = 'sm',
  icon,
  children,
  className,
  ...rest
}: TonePillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-transparent font-medium uppercase tracking-wider',
        `tone-bg-${tone}`,
        sizeMap[size],
        className,
      )}
      {...rest}
    >
      {icon && <span className="shrink-0 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
