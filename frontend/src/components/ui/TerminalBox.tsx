'use client';

import { ReactNode, useState, useCallback } from 'react';

interface TerminalBoxProps {
  title?: string;
  children: ReactNode;
  copyContent?: string;
  className?: string;
}

export default function TerminalBox({
  title = 'terminal',
  children,
  copyContent,
  className = '',
}: TerminalBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!copyContent) return;
    try {
      await navigator.clipboard.writeText(copyContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = copyContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copyContent]);

  return (
    <div
      className={`bg-[#060810] rounded-lg border border-[rgba(0,255,163,0.2)] overflow-hidden ${className}`}
    >
      {/* Header bar */}
      <div className="bg-[#0A0D14] px-4 py-2 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B5C]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FFA3]" />
        </div>
        <span className="font-mono text-xs text-[#4A5568] select-none">
          {title}
        </span>
      </div>

      {/* Content */}
      <div className="relative p-5">
        {copyContent && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-md text-[#4A5568] hover:text-[#00FFA3] hover:bg-[rgba(0,255,163,0.06)] transition-all duration-200"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <span className="text-xs font-mono text-[#00FFA3] px-1">
                Copied!
              </span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </button>
        )}
        <div className="font-mono text-sm text-[#00FFA3] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
