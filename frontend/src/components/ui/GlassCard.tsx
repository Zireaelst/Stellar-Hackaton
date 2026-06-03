'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowing?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  glowing = false,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={`
        relative bg-[#0A0D14] border rounded-xl
        transition-all duration-300 ease-out
        ${
          glowing
            ? 'border-[rgba(0,255,163,0.5)] shadow-[0_0_20px_rgba(0,255,163,0.08)]'
            : 'border-white/[0.06] hover:border-[rgba(0,255,163,0.2)] hover:bg-[#0D1018]'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {glowing && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-[rgba(0,255,163,0.03)] to-transparent pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
