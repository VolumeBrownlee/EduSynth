import { motion } from 'framer-motion';

interface ReadyScoreGaugeProps {
  score: number;
  size?: number;
}

export function ReadyScoreGauge({ score, size = 120 }: ReadyScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const getColor = () => {
    if (score >= 70) return '#2DD4BF';
    if (score >= 40) return '#F59E0B';
    return '#71717A';
  };

  const getGlowClass = () => {
    if (score >= 70) return 'pulse-teal';
    if (score >= 40) return 'pulse-amber';
    return '';
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${getGlowClass()}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={center} cy={center} r={radius} stroke="rgba(39, 39, 42, 0.5)" strokeWidth="6" fill="none" />
        <motion.circle
          cx={center} cy={center} r={radius}
          stroke={getColor()} strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${getColor()}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-bold"
          style={{ color: getColor(), fontSize: size > 100 ? '1.5rem' : '0.875rem' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {Math.round(score)}%
        </motion.span>
        {size > 100 && (
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Ready</span>
        )}
      </div>
    </div>
  );
}
