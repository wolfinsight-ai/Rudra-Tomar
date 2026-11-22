import { Bookmark, CalendarClock, FileText, Search, ShieldAlert, X } from 'lucide-react';
import {
  SECTOR_FILTERS,
  formatDeadlineCountdown,
  formatShortDate,
  getDaysRemaining,
} from '../lib/formatters';
import type { Policy, SectorFilter } from '../types/intelligence';

interface KpiOverviewProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSector: SectorFilter;
  onSectorChange: (sector: SectorFilter) => void;
  policies: Policy[];
  watchlistIds: Set<string>;
  loading: boolean;
  isAuthenticated: boolean;
}

export function KpiOverview({
  searchQuery,
  onSearchChange,
  selectedSector,
  onSectorChange,
  policies,
  watchlistIds,
  loading,
  isAuthenticated,
}: KpiOverviewProps) {
  const highImpactCount = policies.filter((p) => p.impact_level === 'High').length;

  const upcomingSorted = policies
    .map((p) => ({
      policy: p,
      days: getDaysRemaining(p.deadline_date),
    }))
    .filter((entry): entry is { policy: Policy; days: number } => entry.days !== null && entry.days >= 0)
    .sort((a, b) => a.days - b.days);

  const nextDeadlineEntry = upcomingSorted[0] ?? null;

  return (
    <section id="policy-feed" aria-label="Command Search and KPI Overview" className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Regulatory &amp; Market Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track central and state energy directives, compliance deadlines, and commercial impact across clean power sectors.
          </p>
        </div>
      </div>

      {/* Command Search + Sector Filter Strip */}
      <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search policies by title, authority (e.g. CERC, MNRE), state, or executive summary..."
            aria-label="Search regulatory policies"
            className="h-11 w-full rounded-lg border border-[#1D4ED8]/35 bg-[#050507] pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sector Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sector filter">
          {SECTOR_FILTERS.map((sector) => {
            const active = selectedSector === sector;
            return (
              <button
                key={sector}
                type="button"
                onClick={() => onSectorChange(sector)}
                className={`h-9 rounded-lg border px-3.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#00F0FF] focus-visible:outline-offset-2 ${
                  active
                    ? 'border-[#00F0FF] bg-[#00F0FF]/12 text-[#00F0FF]'
                    : 'border-[#1D4ED8]/30 bg-[#050507] text-slate-300 hover:border-[#3B82F6]/60 hover:text-white'
                }`}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Policies */}
        <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Policies</span>
            <FileText className="h-4 w-4 text-[#3B82F6]" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-slate-800" />
            ) : (
              <span className="font-mono text-3xl font-semibold tracking-tight text-white tabular-nums">
                {policies.length}
              </span>
            )}
            <span className="text-xs text-slate-400">tracked filings</span>
          </div>
        </div>

        {/* KPI 2: My Watchlist */}
        <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">My Watchlist</span>
            <Bookmark className="h-4 w-4 text-[#00F0FF]" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-slate-800" />
            ) : (
              <span className="font-mono text-3xl font-semibold tracking-tight text-white tabular-nums">
                {isAuthenticated ? watchlistIds.size : 0}
              </span>
            )}
            <span className="text-xs text-slate-400">
              {isAuthenticated ? 'bookmarked' : 'sign in to sync'}
            </span>
          </div>
        </div>

        {/* KPI 3: High Impact Alerts */}
        <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High Impact Alerts</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-slate-800" />
            ) : (
              <span className="font-mono text-3xl font-semibold tracking-tight text-white tabular-nums">
                {highImpactCount}
              </span>
            )}
            <span className="text-xs text-slate-400">material impact</span>
          </div>
        </div>

        {/* KPI 4: Next Deadline */}
        <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Next Deadline</span>
            <CalendarClock className="h-4 w-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-8 w-28 animate-pulse rounded bg-slate-800" />
            ) : nextDeadlineEntry ? (
              <div className="space-y-0.5">
                <span className="block font-mono text-xl font-semibold tracking-tight text-[#00F0FF] tabular-nums">
                  {formatDeadlineCountdown(nextDeadlineEntry.days)}
                </span>
                <span className="block truncate text-xs text-slate-400">
                  {formatShortDate(nextDeadlineEntry.policy.deadline_date)} ·{' '}
                  {nextDeadlineEntry.policy.authority}
                </span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span className="block font-mono text-xl font-semibold text-slate-300">—</span>
                <span className="block text-xs text-slate-500">No upcoming dates</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
