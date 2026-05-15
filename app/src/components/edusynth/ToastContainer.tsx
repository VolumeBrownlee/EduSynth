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
  achievement: { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', text: 'text-[#F59E0B]' },
  success: { bg: 'bg-[#2DD4BF]/10', border: 'border-[#2DD4BF]/30', text: 'text-[#2DD4BF]' },
  warning: { bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/30', text: 'text-[#EF4444]' },
  info: { bg: 'bg-zinc-800/60', border: 'border-zinc-700/30', text: 'text-zinc-300' },
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
      className={`flex items-start gap-3 p-3.5 rounded-xl glass-strong border ${color.border} shadow-lg min-w-[280px] max-w-[320px]`}
    >
      <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-100">{toast.title}</p>
        <p className="text-[10px] text-zinc-400 mt-0.5">{toast.message}</p>
      </div>
      <button onClick={() => removeToast(toast.id)} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
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
