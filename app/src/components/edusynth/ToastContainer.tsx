import { AnimatePresence, motion } from 'framer-motion';
import { X, Trophy, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useEduSynthStore } from '@/store/edusynth-store';
import { useEffect } from 'react';

const ICONS = {
  achievement: Trophy,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};
const COLORS = {
  achievement: { bg: 'bg-accent/10', border: 'border-accent/30', text: 'text-accent' },
  success: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' },
  warning: { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive' },
  info: { bg: 'bg-muted', border: 'border-border/30', text: 'text-foreground' },
};

function ToastItem({ toast }: { toast: { id: string; type: keyof typeof ICONS; title: string; message: string; duration?: number } }) {
  const { removeToast } = useEduSynthStore();
  const Icon = ICONS[toast.type];
  const color = COLORS[toast.type];

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 p-3.5 rounded-xl card-elevated border ${color.border} shadow-lg min-w-[280px] max-w-[320px]`}
    >
      <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{toast.title}</p>
        <p className="text-2xs text-muted-foreground mt-0.5">{toast.message}</p>
      </div>
      <button onClick={() => removeToast(toast.id)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts } = useEduSynthStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t as any} />
        ))}
      </AnimatePresence>
    </div>
  );
}
