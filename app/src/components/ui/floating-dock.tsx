import * as React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tone } from './tone-pill';

export interface DockItem {
  id: string;
  icon: LucideIcon;
  label: string;
  tone?: Tone;
  shortcut?: string;
  active?: boolean;
  badge?: string | number;
  onClick: () => void;
}

interface FloatingDockProps {
  items: DockItem[];
  /** Position (default: bottom-right) */
  position?: 'bottom-right' | 'bottom-center';
  /** Custom right-side panel (e.g. live timer display) */
  trailing?: React.ReactNode;
  className?: string;
}

const toneRing = {
  brand:   'text-[#0F766E] dark:text-[#0F766E]',
  energy:  'text-[#D97706] dark:text-[#F59E0B]',
  arcane:  'text-[#7C3AED] dark:text-[#8B5CF6]',
  triumph: 'text-[#D97706] dark:text-[#FBBF24]',
  danger:  'text-[#DC2626] dark:text-[#F87171]',
  success: 'text-[#059669] dark:text-[#10B981]',
  neutral: 'text-foreground',
};

export function FloatingDock({
  items,
  position = 'bottom-right',
  trailing,
  className,
}: FloatingDockProps) {
  const positionCls =
    position === 'bottom-right'
      ? 'bottom-5 right-5'
      : 'bottom-5 left-1/2 -translate-x-1/2';

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 28 }}
      className={cn('fixed z-40 flex items-center', positionCls, className)}
    >
      <div className="glass-premium rounded-full p-1.5 flex items-center gap-1 shadow-xl">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
              aria-label={item.label}
              className={cn(
                'group relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-quick',
                item.active
                  ? cn('bg-foreground/10 dark:bg-white/15', toneRing[item.tone || 'brand'])
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-white/8',
              )}
            >
              <Icon className="w-4 h-4" />
              {item.badge != null && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#EF4444] text-white text-micro font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        {trailing && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <div className="px-2">{trailing}</div>
          </>
        )}
      </div>
    </motion.div>
  );
}
