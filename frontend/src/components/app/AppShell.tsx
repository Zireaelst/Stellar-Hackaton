'use client';

import { ReactNode } from 'react';
import { StatsBar } from './StatsBar';
import { AssociationSetsSidebar } from './AssociationSetsSidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#030508]">
      {/* Top Stats Bar */}
      <StatsBar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left: Main Panel */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-2xl">
            {children}
          </div>
        </main>

        {/* Right: Sidebar (hidden on mobile, shown on desktop) */}
        <aside className="w-full border-t border-white/[0.04] lg:w-[340px] lg:border-t-0">
          <div className="sticky top-0 h-auto lg:h-[calc(100vh-49px)] lg:overflow-y-auto">
            <AssociationSetsSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}
