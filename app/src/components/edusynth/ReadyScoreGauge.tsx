import { motion } from 'framer-motion';

interface ReadyScoreGaugeProps {
  score: number;
  size?: number;
}

/**
 * Circular Ready-Score gauge.
 *  ≥70 — primary (ready)
 *  ≥40 — accent  (warming up)
 *  <40 — muted   (early)
 */
export function ReadyScoreGauge({ score, size = 120 }: ReadyScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const colorVar =
    score >= 70 ? 'hsl(var(--primary))'
  : score >= 40 ? 'hsl(var(--accent))'
  :               'hsl(var(--muted-foreground))';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={center} cy={center} r={radius} stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
        {/* Progress arc */}
        <motion.circle
          cx={center} cy={center} r={radius}
          stroke={colorVar} strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display font-bold tabular-nums"
          style={{ color: colorVar, fontSize: size > 100 ? '1.75rem' : '1rem' }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {Math.round(score)}%
        </motion.span>
        {size > 100 && (
          <span className="text-2xs text-muted-foreground uppercase tracking-wider mt-0.5">Ready</span>
        )}
      </div>
    </div>
  );
}
