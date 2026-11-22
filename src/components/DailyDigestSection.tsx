import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  Mail,
  Send,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  formatDeadlineCountdown,
  formatShortDate,
  getDaysRemaining,
} from '../lib/formatters';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Policy } from '../types/intelligence';

interface DailyDigestSectionProps {
  policies: Policy[];
}

export function DailyDigestSection({ policies }: DailyDigestSectionProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewOpen]);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setErrorMessage('Enter a valid work email address.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to save subscribers.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert({ email: normalizedEmail });

      if (error) {
        if (error.code === '23505') {
          setSuccessMessage(`${normalizedEmail} is already subscribed to the Daily Digest.`);
          setEmail('');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setSuccessMessage(`Subscribed ${normalizedEmail} to the 07:00 IST Daily Regulatory Digest.`);
        setEmail('');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to save subscription.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const topPolicies = [...policies]
    .sort((a, b) => {
      const weight = { High: 0, Medium: 1, Low: 2 };
      return weight[a.impact_level] - weight[b.impact_level];
    })
    .slice(0, 4);

  const upcomingDeadlines = policies
    .map((policy) => ({ policy, days: getDaysRemaining(policy.deadline_date) }))
    .filter((entry): entry is { policy: Policy; days: number } => entry.days !== null && entry.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section
      id="daily-digest"
      aria-labelledby="daily-digest-heading"
      className="border-t border-[#1D4ED8]/25 pt-10"
    >
      <div className="rounded-xl border border-[#1D4ED8]/35 bg-[#0B0F19] p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#00F0FF]">
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>Daily Executive Briefing</span>
            </div>
            <h2 id="daily-digest-heading" className="text-xl font-semibold text-white sm:text-2xl">
              Receive the Daily Regulatory &amp; Tariff Digest
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              One structured morning brief summarizing newly published CERC, SERC, and MNRE orders, high-impact compliance alerts, and approaching consultation deadlines.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#1D4ED8]/45 bg-[#050507] px-4 text-xs font-semibold text-[#00F0FF] transition-colors hover:border-[#00F0FF] focus-visible:outline-2 focus-visible:outline-[#00F0FF]"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                <span>Preview Daily Digest Template</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={handleSubscribe} className="space-y-3">
              <label htmlFor="digest-email" className="block text-xs font-medium text-slate-300">
                Work Email Address
              </label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  id="digest-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="strategy@energyfirm.com"
                  className="h-11 flex-1 rounded-lg border border-[#1D4ED8]/35 bg-[#050507] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB] disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{submitting ? 'Subscribing...' : 'Subscribe'}</span>
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-[#00F0FF]/40 bg-[#00F0FF]/10 p-3 text-xs text-slate-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00F0FF]" aria-hidden="true" />
                  <span>{successMessage}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* HTML Email Preview Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="digest-preview-title"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#1D4ED8]/45 bg-[#0B0F19] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1D4ED8]/30 px-6 py-4">
              <div>
                <h3 id="digest-preview-title" className="text-base font-semibold text-white">
                  Daily Digest HTML Email Preview
                </h3>
                <p className="text-xs text-slate-400">
                  Subject: VoltReg Daily Briefing — {todayFormatted}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close daily digest preview"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Simulated Email Client Canvas */}
            <div className="overflow-y-auto bg-[#050507] p-6 subtle-scroll">
              <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-[#1D4ED8]/35 bg-[#0B0F19] text-slate-200">
                {/* Email Header */}
                <div className="border-b border-[#1D4ED8]/30 bg-[#050507] px-6 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      VoltReg Intel
                    </span>
                    <span className="font-mono text-xs text-[#00F0FF]">
                      {todayFormatted}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Daily B2B Regulatory &amp; Clean Energy Market Dispatch
                  </p>
                </div>

                {/* Email Body */}
                <div className="space-y-6 p-6">
                  <div>
                    <h4 className="text-sm font-semibold text-[#00F0FF]">
                      Top Regulatory Filings &amp; Impact Highlights
                    </h4>
                    {topPolicies.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">
                        No policies are currently loaded in the database. Once policies are added to Supabase, they will automatically populate this daily dispatch.
                      </p>
                    ) : (
                      <div className="mt-3 divide-y divide-[#1D4ED8]/20 border-y border-[#1D4ED8]/20">
                        {topPolicies.map((p) => (
                          <div key={p.id} className="py-3.5">
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                              <span>
                                {p.authority} · {p.state} · {p.sector}
                              </span>
                              <span
                                className={`font-semibold ${
                                  p.impact_level === 'High'
                                    ? 'text-rose-400'
                                    : p.impact_level === 'Medium'
                                      ? 'text-[#3B82F6]'
                                      : 'text-slate-400'
                                }`}
                              >
                                {p.impact_level} Impact
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {p.title}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-slate-300">
                              {p.executive_summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#3B82F6]">
                      Approaching Compliance Deadlines
                    </h4>
                    {upcomingDeadlines.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">
                        No upcoming deadlines within the current window.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        {upcomingDeadlines.map(({ policy, days }) => (
                          <div
                            key={policy.id}
                            className="flex items-center justify-between gap-4 border-b border-[#1D4ED8]/15 pb-2.5 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium text-white">
                                {policy.title}
                              </div>
                              <div className="text-slate-400">
                                {policy.authority} · {policy.state}
                              </div>
                            </div>
                            <div className="shrink-0 text-right font-mono tabular-nums">
                              <div className="text-[#00F0FF]">
                                {formatDeadlineCountdown(days)}
                              </div>
                              <div className="text-slate-500">
                                {formatShortDate(policy.deadline_date)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Footer */}
                <div className="border-t border-[#1D4ED8]/25 bg-[#050507] px-6 py-4 text-[11px] text-slate-500">
                  Sent via VoltReg Intel Briefing Engine · Manage watchlist preferences in your analyst portal.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
