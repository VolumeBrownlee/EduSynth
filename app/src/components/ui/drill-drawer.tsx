import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tone } from './tone-pill';

interface DrillDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: Tone;
  /** Side ("right" default) or full-screen overlay */
  side?: 'right' | 'overlay';
  children: React.ReactNode;
  className?: string;
}

export function DrillDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  tone = 'brand',
  side = 'right',
  children,
  className,
}: DrillDrawerProps) {
  // Lock body scroll while open
  React.useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const widthCls = side === 'right' ? 'w-full md:w-[520px] md:max-w-[90vw]' : 'w-[90vw] max-w-3xl';
  const positionCls =
    side === 'right'
      ? 'right-0 top-0 bottom-0'
      : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={
              side === 'right'
                ? { x: '100%', opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 20 }
            }
            animate={
              side === 'right'
                ? { x: 0, opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              side === 'right'
                ? { x: '100%', opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 20 }
            }
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className={cn(
              'fixed z-[100] glass-strong hud-corners',
              positionCls,
              widthCls,
              side === 'right' ? 'rounded-l-3xl' : 'rounded-3xl',
              'flex flex-col overflow-hidden',
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-border/60 shrink-0">
              <div className="flex items-start gap-3">
                {Icon && (
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      `tone-bg-${tone}`,
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h2 className="text-hero font-display font-semibold text-foreground leading-tight">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-caption text-muted-foreground mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground transition-colors w-8 h-8 rounded-lg hover:bg-foreground/5 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
