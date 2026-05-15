import { useEduSynthStore } from '@/store/edusynth-store';
import { motion } from 'framer-motion';
import React from 'react';

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
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(39, 39, 42, 0.5)"
          strokeWidth="6"
          fill="none"
        />
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getColor()}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white" style={{ color: getColor() }}>
            {score}
          </div>
          <div className="text-xs text-zinc-400 font-medium">READY</div>
        </div>
      </div>
    </div>
  );
}