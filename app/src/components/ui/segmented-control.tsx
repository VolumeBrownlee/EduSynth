import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  segments: Segment<T>[];
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const heightCls = size === 'sm' ? 'h-7' : 'h-9';
  const padCls = size === 'sm' ? 'px-2.5 text-caption' : 'px-3.5 text-body';

  return (
    <div
      className={cn(
        'glass-premium relative inline-flex items-center rounded-full p-0.5 gap-0',
        heightCls,
        className,
      )}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            onClick={() => onChange(seg.value)}
            className={cn(
              'relative z-10 inline-flex items-center gap-1.5 rounded-full font-medium transition-colors duration-quick',
              padCls,
              heightCls,
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            {active && (
              <motion.span
                layoutId="seg-active"
                className="absolute inset-0 rounded-full bg-foreground/8 dark:bg-white/10 border border-foreground/10 dark:border-white/15 shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {seg.icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{seg.icon}</span>}
              {seg.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
