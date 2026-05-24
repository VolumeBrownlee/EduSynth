import { AnimatePresence, motion } from 'framer-motion';
import { useEduSynthStore } from '@/store/edusynth-store';
import { useEffect } from 'react';

function XpFloater({ item }: { item: { id: string; amount: number; x: number; y: number } }) {
  const { clearXpAnimation } = useEduSynthStore();

  useEffect(() => {
    const t = setTimeout(() => clearXpAnimation(item.id), 1600);
    return () => clearTimeout(t);
  }, [item.id, clearXpAnimation]);

  return (
    <motion.div
      className="fixed z-[200] pointer-events-none select-none"
      style={{ left: item.x, top: item.y }}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.3 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <span className="text-primary font-bold text-sm drop-shadow-lg">+{item.amount} XP</span>
    </motion.div>
  );
}

export function XpAnimationLayer() {
  const { xpAnimations } = useEduSynthStore();

  return (
    <AnimatePresence>
      {xpAnimations.map((a) => (
        <XpFloater key={a.id} item={a} />
      ))}
    </AnimatePresence>
  );
}
