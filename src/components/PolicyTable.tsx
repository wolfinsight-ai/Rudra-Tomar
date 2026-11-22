import {
  AlertCircle,
  Bookmark,
  ExternalLink,
  FileSearch,
  Loader2,
} from 'lucide-react';
import { formatShortDate, sanitizeExternalUrl } from '../lib/formatters';
import type { Policy } from '../types/intelligence';
import { ImpactBadge } from './ImpactBadge';

interface PolicyTableProps {
  policies: Policy[];
  watchlistIds: Set<string>;
  activeTab: 'all' | 'watchlist';
  onTabChange: (tab: 'all' | 'watchlist') => void;
  onSelectPolicy: (policy: Policy) => void;
  onToggleWatchlist: (policyId: string) => void;
  pendingWatchlistId: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function PolicyTable({
  policies,
  watchlistIds,
  activeTab,
  onTabChange,
  onSelectPolicy,
  onToggleWatchlist,
  pendingWatchlistId,
  loading,
  error,
  isAuthenticated,
  onOpenAuth,
  onClearFilters,
  hasActiveFilters,
}: PolicyTableProps) {
  const displayedPolicies =
    activeTab === 'watchlist'
      ? policies.filter((p) => watchlistIds.has(p.id))
      : policies;

  return (
    <section aria-labelledby="policy-table-heading" className="space-y-4">
      {/* Header & View Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="policy-table-heading" className="text-lg font-semibold text-white">
            Policy Intelligence Feed
          </h2>
          <p className="text-xs text-slate-400">
            Select any policy row to open the Executive Summary &amp; Business Impact Inspector.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Policy feed views"
          className="inline-flex rounded-lg border border-[#1D4ED8]/30 bg-[#0B0F19] p-1 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => onTabChange('all')}
            className={`h-9 rounded-md px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#3B82F6] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Policies ({policies.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'watchlist'}
            onClick={() => onTabChange('watchlist')}
            className={`h-9 rounded-md px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'watchlist'
                ? 'bg-[#3B82F6] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Watchlist ({isAuthenticated ? watchlistIds.size : 0})
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
          <div>
            <p className="font-medium text-rose-100">Unable to load regulatory policies</p>
            <p className="mt-0.5 text-xs text-rose-300/90">{error}</p>
          </div>
        </div>
      )}

      {/* Table Surface */}
      <div className="overflow-hidden rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19]">
        {loading ? (
          <div className="divide-y divide-[#1D4ED8]/20">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-slate-800/70" />
                </div>
                <div className="h-7 w-20 animate-pulse rounded bg-slate-800" />
              </div>
            ))}
          </div>
        ) : activeTab === 'watchlist' && !isAuthenticated ? (
          <div className="px-6 py-12 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-[#3B82F6]" aria-hidden="true" />
            <h3 className="mt-3 text-base font-semibold text-white">
              Sign in to view your saved watchlist
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
              Your bookmarked policies are persisted privately in Supabase so your team can track priority filings across sessions.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#00F0FF] px-4 text-xs font-semibold text-[#050507] transition-colors hover:bg-[#38F5FF]"
            >
              Log In / Sign Up
            </button>
          </div>
        ) : displayedPolicies.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileSearch className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
            <h3 className="mt-3 text-base font-semibold text-white">
              {activeTab === 'watchlist'
                ? 'Your watchlist has no saved policies'
                : 'No regulatory policies match your current view'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
              {activeTab === 'watchlist'
                ? 'Bookmark policies from the All Policies feed to monitor key orders and compliance filings here.'
                : hasActiveFilters
                  ? 'Try clearing your search query or switching back to All sectors.'
                  : 'No rows were found in the Supabase policies table yet.'}
            </p>
            {hasActiveFilters && activeTab === 'all' && (
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-4 inline-flex h-9 items-center rounded-lg border border-[#1D4ED8]/40 bg-[#050507] px-3.5 text-xs font-medium text-[#00F0FF] hover:border-[#00F0FF]/60"
              >
                Reset Search &amp; Sector Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1D4ED8]/25 bg-[#050507]/60 text-xs font-medium text-slate-400">
                  <th scope="col" className="px-5 py-3.5">
                    Policy Title
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Authority &amp; State
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Sector
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Impact Level
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Source &amp; Watchlist
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D4ED8]/20 text-sm">
                {displayedPolicies.map((policy) => {
                  const isSaved = watchlistIds.has(policy.id);
                  const isPending = pendingWatchlistId === policy.id;
                  const safePdfUrl = sanitizeExternalUrl(policy.source_pdf_url);

                  return (
                    <tr
                      key={policy.id}
                      onClick={() => onSelectPolicy(policy)}
                      className="group cursor-pointer transition-colors hover:bg-[#1D4ED8]/10"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-slate-100 group-hover:text-[#00F0FF] transition-colors">
                          {policy.title}
                        </div>
                        {policy.deadline_date && (
                          <div className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
                            Deadline: {formatShortDate(policy.deadline_date)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top text-xs text-slate-300">
                        <div className="font-medium text-slate-200">{policy.authority}</div>
                        <div className="mt-0.5 text-slate-400">{policy.state}</div>
                      </td>

                      <td className="px-4 py-4 align-top text-xs text-slate-300 whitespace-nowrap">
                        {policy.sector}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <ImpactBadge level={policy.impact_level} />
                      </td>

                      <td
                        className="px-4 py-4 align-top text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-2">
                          {safePdfUrl ? (
                            <a
                              href={safePdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open official source PDF"
                              aria-label={`Open source PDF for ${policy.title}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1D4ED8]/35 bg-[#050507] text-slate-300 transition-colors hover:border-[#00F0FF]/60 hover:text-[#00F0FF] focus-visible:outline-2 focus-visible:outline-[#00F0FF]"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                          ) : (
                            <span
                              title="No source PDF attached"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#050507]/50 text-slate-600"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onToggleWatchlist(policy.id)}
                            aria-label={
                              isSaved
                                ? `Remove ${policy.title} from watchlist`
                                : `Save ${policy.title} to watchlist`
                            }
                            aria-pressed={isSaved}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-[#00F0FF] ${
                              isSaved
                                ? 'border-[#00F0FF]/60 bg-[#00F0FF]/15 text-[#00F0FF]'
                                : 'border-[#1D4ED8]/35 bg-[#050507] text-slate-400 hover:border-[#3B82F6] hover:text-white'
                            }`}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Bookmark
                                className={`h-4 w-4 ${isSaved ? 'fill-[#00F0FF]' : ''}`}
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
