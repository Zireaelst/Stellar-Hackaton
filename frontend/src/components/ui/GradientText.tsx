'use client';

import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  variant?: 'primary' | 'warm';
  animated?: boolean;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}

const gradients = {
  primary: 'from-[#00FFA3] via-[#00D4FF] to-[#3B82F6]',
  warm: 'from-[#F59E0B] via-[#EF4444] to-[#EC4899]',
};

export default function GradientText({
  children,
  variant = 'primary',
  animated = false,
  className = '',
  as: Tag = 'span',
}: GradientTextProps) {
  return (
    <>
      {animated && (
        <style jsx global>{`
          @keyframes gradient-shift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          .animate-gradient-shift {
            background-size: 200% 200%;
            animation: gradient-shift 3s ease infinite;
          }
        `}</style>
      )}
      <Tag
        className={`
          bg-gradient-to-r ${gradients[variant]}
          bg-clip-text text-transparent
          ${animated ? 'animate-gradient-shift' : ''}
          ${className}
        `}
      >
        {children}
      </Tag>
    </>
  );
}
