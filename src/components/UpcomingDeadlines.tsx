import { ArrowUpRight, CalendarClock, Clock } from 'lucide-react';
import {
  formatDeadlineCountdown,
  formatShortDate,
  getDaysRemaining,
} from '../lib/formatters';
import type { Policy } from '../types/intelligence';

interface UpcomingDeadlinesProps {
  policies: Policy[];
  loading: boolean;
  onSelectPolicy: (policy: Policy) => void;
}

export function UpcomingDeadlines({
  policies,
  loading,
  onSelectPolicy,
}: UpcomingDeadlinesProps) {
  const deadlineItems = policies
    .map((policy) => ({
      policy,
      days: getDaysRemaining(policy.deadline_date),
    }))
    .filter((item): item is { policy: Policy; days: number } => item.days !== null)
    .sort((a, b) => {
      // Prioritize upcoming (>=0) first, then recently overdue
      if (a.days >= 0 && b.days < 0) return -1;
      if (a.days < 0 && b.days >= 0) return 1;
      return a.days - b.days;
    })
    .slice(0, 8);

  return (
    <section
      id="upcoming-deadlines"
      aria-labelledby="upcoming-deadlines-heading"
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <CalendarClock className="h-5 w-5 text-[#00F0FF]" aria-hidden="true" />
          <h2 id="upcoming-deadlines-heading" className="text-lg font-semibold text-white">
            Upcoming Compliance &amp; Consultation Deadlines
          </h2>
        </div>
        <span className="font-mono text-xs text-slate-400 tabular-nums">
          {deadlineItems.length} scheduled
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-36 animate-pulse rounded-xl border border-[#1D4ED8]/25 bg-[#0B0F19]"
            />
          ))}
        </div>
      ) : deadlineItems.length === 0 ? (
        <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] px-6 py-8 text-center">
          <p className="text-sm font-medium text-slate-300">
            No upcoming policy deadlines scheduled yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Policies with a <code className="font-mono text-slate-400">deadline_date</code> will automatically appear in chronological order here.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 subtle-scroll">
          {deadlineItems.map(({ policy, days }) => {
            const isUrgent = days >= 0 && days <= 14;
            const isOverdue = days < 0;

            return (
              <button
                key={policy.id}
                type="button"
                onClick={() => onSelectPolicy(policy)}
                className="group flex w-72 shrink-0 flex-col justify-between rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] p-4 text-left transition-colors hover:border-[#00F0FF]/60 focus-visible:outline-2 focus-visible:outline-[#00F0FF] focus-visible:outline-offset-2"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs font-medium tabular-nums ${
                        isOverdue
                          ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                          : isUrgent
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                            : 'border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF]'
                      }`}
                    >
                      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>{formatDeadlineCountdown(days)}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {formatShortDate(policy.deadline_date)}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-[#00F0FF] transition-colors">
                    {policy.title}
                  </h3>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#1D4ED8]/20 pt-3 text-xs text-slate-400">
                  <span className="truncate">
                    {policy.authority} · {policy.state}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#3B82F6] group-hover:text-[#00F0FF] shrink-0">
                    Inspect
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
