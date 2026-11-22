import {
  Bookmark,
  BriefcaseBusiness,
  CalendarClock,
  ExternalLink,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import {
  formatDeadlineCountdown,
  formatShortDate,
  getDaysRemaining,
  sanitizeExternalUrl,
} from '../lib/formatters';
import type { Policy } from '../types/intelligence';
import { ImpactBadge } from './ImpactBadge';

interface PolicyInspectorDrawerProps {
  policy: Policy | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleWatchlist: (policyId: string) => void;
  pendingWatchlist: boolean;
}

export function PolicyInspectorDrawer({
  policy,
  onClose,
  isSaved,
  onToggleWatchlist,
  pendingWatchlist,
}: PolicyInspectorDrawerProps) {
  useEffect(() => {
    if (!policy) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [policy, onClose]);

  if (!policy) return null;

  const daysRemaining = getDaysRemaining(policy.deadline_date);
  const safePdfUrl = sanitizeExternalUrl(policy.source_pdf_url);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-policy-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col border-l border-[#1D4ED8]/40 bg-[#0B0F19] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Inspector Bar */}
        <div className="flex items-start justify-between gap-4 border-b border-[#1D4ED8]/30 px-6 py-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-200">{policy.authority}</span>
              <span aria-hidden="true">·</span>
              <span>{policy.state}</span>
              <span aria-hidden="true">·</span>
              <span>{policy.sector}</span>
            </div>
            <h2
              id="inspector-policy-title"
              className="text-xl font-semibold leading-snug text-white"
            >
              {policy.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close policy inspector"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1D4ED8]/30 bg-[#050507] text-slate-400 transition-colors hover:border-[#00F0FF]/50 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00F0FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1D4ED8]/20 bg-[#050507]/60 px-6 py-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <ImpactBadge level={policy.impact_level} />
            {policy.deadline_date && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 tabular-nums">
                <CalendarClock className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
                <span>
                  {formatShortDate(policy.deadline_date)} ({formatDeadlineCountdown(daysRemaining)})
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={pendingWatchlist}
            onClick={() => onToggleWatchlist(policy.id)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors ${
              isSaved
                ? 'border-[#00F0FF]/60 bg-[#00F0FF]/15 text-[#00F0FF]'
                : 'border-[#1D4ED8]/40 bg-[#0B0F19] text-slate-200 hover:border-[#3B82F6]'
            }`}
          >
            {pendingWatchlist ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Bookmark
                className={`h-3.5 w-3.5 ${isSaved ? 'fill-[#00F0FF]' : ''}`}
                aria-hidden="true"
              />
            )}
            <span>{isSaved ? 'Saved in Watchlist' : 'Save to Watchlist'}</span>
          </button>
        </div>

        {/* Scrollable Content Blocks */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 subtle-scroll">
          {/* Block 1: Executive Summary */}
          <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#050507] p-5">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-[#00F0FF]">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Executive Summary</span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
              {policy.executive_summary || 'No executive summary recorded for this policy.'}
            </p>
          </div>

          {/* Block 2: Sector & Business Impact */}
          <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#050507] p-5">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-[#3B82F6]">
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              <span>Sector &amp; Business Impact</span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
              {policy.business_impact || 'No sector & business impact analysis recorded yet.'}
            </p>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-[#1D4ED8]/30 bg-[#050507]/80 px-6 py-4">
          <span className="text-xs text-slate-400">
            Verify full regulatory clauses in the official gazette or filing PDF.
          </span>
          {safePdfUrl ? (
            <a
              href={safePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#00F0FF] px-4 text-xs font-semibold text-[#050507] transition-colors hover:bg-[#38F5FF] whitespace-nowrap shrink-0"
            >
              <span>Official Source PDF</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : (
            <span className="inline-flex h-10 items-center rounded-lg border border-slate-700 px-4 text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
              PDF Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
