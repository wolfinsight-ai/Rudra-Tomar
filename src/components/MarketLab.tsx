import type { User } from '@supabase/supabase-js';
import {
  AlertCircle,
  Building2,
  Edit3,
  FileSpreadsheet,
  Loader2,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  ASSESSMENT_RATINGS,
  SUGGESTED_COMPANIES,
  formatShortDate,
} from '../lib/formatters';
import type {
  AssessmentRating,
  CompanyAssessment,
  Policy,
} from '../types/intelligence';
import { RatingBadge } from './ImpactBadge';

interface MarketLabProps {
  user: User | null;
  policies: Policy[];
  assessments: CompanyAssessment[];
  loading: boolean;
  error: string | null;
  onOpenAuth: () => void;
  onCreateAssessment: (payload: {
    company_name: string;
    policy_id: string | null;
    rating: AssessmentRating;
    company_impact: string;
    market_outlook: string;
  }) => Promise<boolean>;
  onUpdateAssessment: (
    id: string,
    payload: {
      company_name: string;
      policy_id: string | null;
      rating: AssessmentRating;
      company_impact: string;
      market_outlook: string;
    }
  ) => Promise<boolean>;
  onDeleteAssessment: (id: string) => Promise<void>;
}

export function MarketLab({
  user,
  policies,
  assessments,
  loading,
  error,
  onOpenAuth,
  onCreateAssessment,
  onUpdateAssessment,
  onDeleteAssessment,
}: MarketLabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [policyId, setPolicyId] = useState<string>('');
  const [rating, setRating] = useState<AssessmentRating>('High');
  const [companyImpact, setCompanyImpact] = useState('');
  const [marketOutlook, setMarketOutlook] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const policyMap = new Map(policies.map((p) => [p.id, p]));

  const resetForm = () => {
    setEditingId(null);
    setCompanyName('');
    setPolicyId('');
    setRating('High');
    setCompanyImpact('');
    setMarketOutlook('');
    setFormError(null);
  };

  const startEdit = (item: CompanyAssessment) => {
    setEditingId(item.id);
    setCompanyName(item.company_name);
    setPolicyId(item.policy_id ?? '');
    setRating(item.rating);
    setCompanyImpact(item.company_impact);
    setMarketOutlook(item.market_outlook);
    setFormError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyName.trim()) {
      setFormError('Please enter or select a company name.');
      return;
    }
    if (!companyImpact.trim() || !marketOutlook.trim()) {
      setFormError('Please complete both the company impact and forward market outlook fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      company_name: companyName.trim(),
      policy_id: policyId || null,
      rating,
      company_impact: companyImpact.trim(),
      market_outlook: marketOutlook.trim(),
    };

    const ok = editingId
      ? await onUpdateAssessment(editingId, payload)
      : await onCreateAssessment(payload);

    setSubmitting(false);
    if (ok) {
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDeleteAssessment(id);
    if (editingId === id) {
      resetForm();
    }
    setDeletingId(null);
  };

  return (
    <section
      id="market-lab"
      aria-labelledby="market-lab-heading"
      className="space-y-6 border-t border-[#1D4ED8]/25 pt-10"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="market-lab-heading" className="text-xl font-semibold text-white">
            Private Company &amp; Market Impact Lab
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Author confidential company exposure briefs and forward market scenarios isolated to your account via Supabase Row-Level Security.
          </p>
        </div>
        {user && (
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            {assessments.length} saved {assessments.length === 1 ? 'brief' : 'briefs'}
          </span>
        )}
      </div>

      {/* Logged-Out Lock Card */}
      {!user ? (
        <div className="rounded-xl border border-[#1D4ED8]/35 bg-[#0B0F19] p-8 sm:p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#1D4ED8]/40 bg-[#050507] text-[#00F0FF]">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">
            Private Workspace Locked
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
            Sign in or create an analyst account to write private company impact assessments, link regulatory orders, and maintain forward market outlooks visible only to you.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#00F0FF] px-5 text-sm font-semibold text-[#050507] transition-colors hover:bg-[#38F5FF] focus-visible:outline-2 focus-visible:outline-white"
          >
            <span>Log In / Sign Up to Unlock</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Analyzer Form */}
          <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] p-6 lg:col-span-5">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#1D4ED8]/20 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#00F0FF]" aria-hidden="true" />
                <h3 className="text-base font-semibold text-white">
                  {editingId ? 'Edit Private Brief' : 'Company & Market Impact Analyzer'}
                </h3>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {formError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="lab-company-name"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Company Name (IPP, Module Maker, or DISCOM)
                </label>
                <input
                  id="lab-company-name"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Waaree Energies, MSEDCL, ReNew Energy"
                  className="h-11 w-full rounded-lg border border-[#1D4ED8]/35 bg-[#050507] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_COMPANIES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCompanyName(preset)}
                      className="rounded border border-[#1D4ED8]/25 bg-[#050507] px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-[#00F0FF]/50 hover:text-[#00F0FF]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="lab-policy-link"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Linked Regulatory Policy (Optional)
                </label>
                <select
                  id="lab-policy-link"
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#1D4ED8]/35 bg-[#050507] px-3 text-sm text-white focus:border-[#00F0FF] focus:outline-none"
                >
                  <option value="">No specific policy linked</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.authority} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-slate-300">
                  Risk / Opportunity Rating
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Risk or Opportunity Rating">
                  {ASSESSMENT_RATINGS.map((option) => {
                    const selected = rating === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setRating(option)}
                        className={`h-10 rounded-lg border px-2 text-xs font-medium transition-colors whitespace-nowrap ${
                          selected
                            ? 'border-[#00F0FF] bg-[#00F0FF]/12 text-[#00F0FF]'
                            : 'border-[#1D4ED8]/30 bg-[#050507] text-slate-300 hover:border-[#3B82F6]/60'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="lab-company-impact"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Impact on This Company
                </label>
                <textarea
                  id="lab-company-impact"
                  rows={3}
                  required
                  value={companyImpact}
                  onChange={(e) => setCompanyImpact(e.target.value)}
                  placeholder="Assess margin sensitivity, capex timing, PPA compliance, or domestic supply-chain exposure..."
                  className="w-full rounded-lg border border-[#1D4ED8]/35 bg-[#050507] p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="lab-market-outlook"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  What Is Going to Happen in the Market (Forward Outlook)
                </label>
                <textarea
                  id="lab-market-outlook"
                  rows={3}
                  required
                  value={marketOutlook}
                  onChange={(e) => setMarketOutlook(e.target.value)}
                  placeholder="Forecast tariff shifts, auction bid behavior, procurement bottlenecks, or 6–18 month sector winners..."
                  className="w-full rounded-lg border border-[#1D4ED8]/35 bg-[#050507] p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#00F0FF] px-4 text-sm font-semibold text-[#050507] transition-colors hover:bg-[#38F5FF] disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                <span>
                  {submitting
                    ? 'Saving...'
                    : editingId
                      ? 'Update Private Brief'
                      : 'Save Private Brief'}
                </span>
              </button>
            </form>
          </div>

          {/* Right Column: Saved Private Briefs Grid */}
          <div className="space-y-4 lg:col-span-7">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[0, 1].map((idx) => (
                  <div
                    key={idx}
                    className="h-48 animate-pulse rounded-xl border border-[#1D4ED8]/25 bg-[#0B0F19]"
                  />
                ))}
              </div>
            ) : assessments.length === 0 ? (
              <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] px-6 py-12 text-center">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-[#3B82F6]" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold text-white">
                  No private company briefs saved yet
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                  Use the analyzer form to record how upcoming orders affect specific IPPs, OEMs, or utilities and build your private market thesis.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {assessments.map((item) => {
                  const linkedPolicy = item.policy_id ? policyMap.get(item.policy_id) : null;
                  const isDeleting = deletingId === item.id;

                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-[#1D4ED8]/30 bg-[#0B0F19] p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-base font-semibold text-white">
                              {item.company_name}
                            </h3>
                            <RatingBadge rating={item.rating} />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="font-mono tabular-nums">
                              {formatShortDate(item.created_at)}
                            </span>
                            {linkedPolicy && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#93C5FD]">
                                  Linked: {linkedPolicy.authority} — {linkedPolicy.title}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            aria-label={`Edit assessment for ${item.company_name}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1D4ED8]/35 bg-[#050507] px-3 text-xs font-medium text-slate-300 transition-colors hover:border-[#00F0FF]/50 hover:text-[#00F0FF]"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(item.id)}
                            aria-label={`Delete assessment for ${item.company_name}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-[#050507] px-3 text-xs font-medium text-rose-300 transition-colors hover:border-rose-500/60 hover:bg-rose-500/10 disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 border-t border-[#1D4ED8]/20 pt-4 sm:grid-cols-2">
                        <div>
                          <div className="mb-1 text-xs font-semibold text-[#00F0FF]">
                            Impact on This Company
                          </div>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                            {item.company_impact}
                          </p>
                        </div>
                        <div className="sm:border-l sm:border-[#1D4ED8]/20 sm:pl-4">
                          <div className="mb-1 text-xs font-semibold text-[#3B82F6]">
                            Forward Market Outlook
                          </div>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                            {item.market_outlook}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
