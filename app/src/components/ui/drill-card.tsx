import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tone } from './tone-pill';

interface DrillCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  suffix?: string;
  delta?: { value: string; positive?: boolean };
  tone?: Tone;
  onClick?: () => void;
  /** Reserved for future use; default is clean white card */
  borderRunner?: boolean;
  hudCorners?: boolean;
  className?: string;
  active?: boolean;
}

const toneText: Record<Tone, string> = {
  brand:   'text-[#0F766E]',
  energy:  'text-[#B45309]',
  arcane:  'text-[#6D28D9]',
  triumph: 'text-[#B45309]',
  danger:  'text-[#B91C1C]',
  success: 'text-[#047857]',
  neutral: 'text-foreground',
};

export function DrillCard({
  icon: Icon,
  label,
  value,
  suffix,
  delta,
  tone = 'brand',
  onClick,
  className,
}: DrillCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'group relative text-left w-full rounded-[12px] p-5 overflow-hidden',
        'surface-1 card-tap',
        'transition-all duration-base ease-out-quart',
        'hover:shadow-md hover:border-border-strong hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {/* Top row: icon + chevron */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            `tone-bg-${tone}`,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <ChevronRight
          className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-quick"
        />
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1">
        <span
          className={cn(
            'text-metric font-bold tabular-nums leading-none tracking-tight',
            toneText[tone],
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className={cn('text-emph font-semibold opacity-60', toneText[tone])}>
            {suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-caption text-muted-foreground font-medium">
        {label}
      </p>

      {/* Delta (optional) */}
      {delta && (
        <div className="mt-3 pt-3 border-t border-border">
          <p
            className={cn(
              'text-caption tabular-nums',
              delta.positive
                ? 'text-[#047857]'
                : 'text-[#B91C1C]',
            )}
          >
            {delta.positive ? '↗' : '↘'} {delta.value}
          </p>
        </div>
      )}
    </motion.button>
  );
}
