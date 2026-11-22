import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, Zap } from 'lucide-react';
import type { NavSection } from '../types/intelligence';

interface HeaderProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  user: User | null;
  watchlistCount: number;
  onOpenAuth: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'policy-feed', label: 'Policy Feed' },
  { id: 'upcoming-deadlines', label: 'Upcoming Deadlines' },
  { id: 'market-lab', label: 'Private Company & Market Lab' },
  { id: 'daily-digest', label: 'Daily Digest' },
];

export function Header({
  activeSection,
  onNavigate,
  user,
  watchlistCount,
  onOpenAuth,
  onSignOut,
  signingOut,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#1D4ED8]/30 bg-[#050507]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <a
          href="#policy-feed"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('policy-feed');
          }}
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#00F0FF] focus-visible:outline-offset-2 rounded"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00F0FF]/40 bg-[#0B0F19] text-[#00F0FF]">
            <Zap className="h-4 w-4" aria-hidden="true" />
          </span>
          <span style={{ fontFamily: 'var(--font-display)' }}>VoltReg Intel</span>
        </a>

        {/* Center: Section Navigation Tabs */}
        <nav
          aria-label="Primary sections"
          className="hidden lg:flex items-center gap-6 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#00F0FF] focus-visible:outline-offset-2 ${
                  isActive
                    ? 'text-[#00F0FF]'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#00F0FF]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: User Auth Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
                <span className="max-w-[180px] truncate font-medium text-slate-100">
                  {user.email}
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="font-mono tabular-nums text-[#00F0FF]">
                  {watchlistCount} saved
                </span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#1D4ED8]/40 bg-[#0B0F19] px-3.5 text-xs font-medium text-slate-200 transition-colors hover:border-[#00F0FF]/50 hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#00F0FF] focus-visible:outline-offset-2"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3B82F6] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#2563EB] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#00F0FF] focus-visible:outline-offset-2"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact mobile section navigation */}
      <div className="flex lg:hidden items-center gap-4 overflow-x-auto border-t border-[#1D4ED8]/20 px-4 py-2.5 subtle-scroll">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive ? 'text-[#00F0FF]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
