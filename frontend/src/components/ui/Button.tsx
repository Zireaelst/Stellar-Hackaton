'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#00FFA3] text-black font-semibold hover:bg-[#00CC85] rounded-lg px-6 py-3 transition-all duration-200 active:scale-95',
  outline:
    'border border-[rgba(0,255,163,0.4)] text-[#00FFA3] hover:bg-[rgba(0,255,163,0.06)] rounded-lg px-6 py-3 transition-all duration-200 active:scale-95',
  ghost:
    'text-[#4A5568] hover:text-[#EDF2F7] px-4 py-2 rounded-lg transition-all duration-200',
  danger:
    'border border-[rgba(255,59,92,0.4)] text-[#FF3B5C] hover:bg-[rgba(255,59,92,0.06)] rounded-lg px-6 py-3 transition-all duration-200 active:scale-95',
};

export default function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-dm text-sm
        ${variantStyles[variant]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
