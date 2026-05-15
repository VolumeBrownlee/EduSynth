import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Tone } from './tone-pill';

interface HeroStatProps {
  value: React.ReactNode;
  label: string;
  delta?: { value: string; positive?: boolean };
  tone?: Tone;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
  suffix?: string;
}

const sizeMap = {
  md: 'text-hero',
  lg: 'text-metric',
  xl: 'text-trophy',
};

const toneText = {
  brand:   'text-[#0F766E] dark:text-[#0F766E]',
  energy:  'text-[#D97706] dark:text-[#F59E0B]',
  arcane:  'text-[#7C3AED] dark:text-[#8B5CF6]',
  triumph: 'text-[#D97706] dark:text-[#FBBF24]',
  danger:  'text-[#DC2626] dark:text-[#F87171]',
  success: 'text-[#059669] dark:text-[#10B981]',
  neutral: 'text-foreground',
};

export function HeroStat({
  value,
  label,
  delta,
  tone = 'neutral',
  size = 'lg',
  suffix,
  className,
}: HeroStatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            'font-mono font-bold tabular-nums leading-none',
            sizeMap[size],
            toneText[tone],
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className={cn('text-emph font-mono opacity-60', toneText[tone])}>
            {suffix}
          </span>
        )}
      </div>
      <p className="text-caption uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      {delta && (
        <p
          className={cn(
            'text-micro font-mono tabular-nums mt-0.5',
            delta.positive
              ? 'text-[#059669] dark:text-[#10B981]'
              : 'text-[#DC2626] dark:text-[#F87171]',
          )}
        >
          {delta.positive ? '↗' : '↘'} {delta.value}
        </p>
      )}
    </div>
  );
}
