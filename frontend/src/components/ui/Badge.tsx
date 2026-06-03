'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'clean' | 'flagged' | 'excluded' | 'testnet';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  clean:
    'bg-[rgba(0,255,163,0.1)] text-[#00FFA3] border border-[rgba(0,255,163,0.2)]',
  flagged:
    'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]',
  excluded:
    'bg-[rgba(255,59,92,0.1)] text-[#FF3B5C] border border-[rgba(255,59,92,0.2)]',
  testnet:
    'bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border border-[rgba(59,130,246,0.2)]',
};

export default function Badge({
  variant,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        text-xs font-mono px-2.5 py-0.5 rounded-full
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
