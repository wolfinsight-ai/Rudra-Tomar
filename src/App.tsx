import type { User } from '@supabase/supabase-js';
import { AlertTriangle, Database } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { DailyDigestSection } from './components/DailyDigestSection';
import { Header } from './components/Header';
import { KpiOverview } from './components/KpiOverview';
import { MarketLab } from './components/MarketLab';
import { PolicyInspectorDrawer } from './components/PolicyInspectorDrawer';
import { PolicyTable } from './components/PolicyTable';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';
import { normalizeImpactLevel } from './lib/formatters';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type {
  AssessmentRating,
  CompanyAssessment,
  NavSection,
  Policy,
  SectorFilter,
} from './types/intelligence';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('policy-feed');
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Policies state
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesError, setPoliciesError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<SectorFilter>('All');
  const [tableTab, setTableTab] = useState<'all' | 'watchlist'>('all');

  // Watchlist state
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [pendingWatchlistId, setPendingWatchlistId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inspector drawer
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Market Lab assessments state
  const [assessments, setAssessments] = useState<CompanyAssessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);

  // Subscribe to Supabase Auth session
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setUser(data.session?.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load policies
  const fetchPolicies = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setPolicies([]);
      setPoliciesLoading(false);
      setPoliciesError(null);
      return;
    }

    setPoliciesLoading(true);
    setPoliciesError(null);
    try {
      const { data, error } = await supabase
        .from('policies')
        .select(
          'id, title, authority, state, sector, impact_level, deadline_date, executive_summary, business_impact, source_pdf_url, created_at'
        )
        .order('deadline_date', { ascending: true, nullsFirst: false });

      if (error) {
        setPoliciesError(error.message);
        setPolicies([]);
      } else {
        const normalized: Policy[] = (data ?? []).map((row) => ({
          id: String(row.id),
          title: row.title ?? 'Untitled Policy',
          authority: row.authority ?? 'Regulatory Authority',
          state: row.state ?? 'National',
          sector: row.sector ?? 'Grid/Tariff',
          impact_level: normalizeImpactLevel(row.impact_level),
          deadline_date: row.deadline_date ?? null,
          executive_summary: row.executive_summary ?? '',
          business_impact: row.business_impact ?? '',
          source_pdf_url: row.source_pdf_url ?? null,
          created_at: row.created_at,
        }));
        setPolicies(normalized);
      }
    } catch (err) {
      setPoliciesError(
        err instanceof Error ? err.message : 'Unexpected error while loading policies.'
      );
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Load user-specific Watchlist & Private Company Assessments
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client || !user) {
      setWatchlistIds(new Set());
      setAssessments([]);
      setAssessmentsError(null);
      return;
    }

    let cancelled = false;

    const loadUserWorkspace = async () => {
      setAssessmentsLoading(true);
      setAssessmentsError(null);

      const [watchlistRes, assessmentsRes] = await Promise.all([
        client
          .from('watchlist')
          .select('policy_id')
          .eq('user_id', user.id),
        client
          .from('company_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;

      if (watchlistRes.error) {
        setActionError(watchlistRes.error.message);
      } else {
        setWatchlistIds(
          new Set((watchlistRes.data ?? []).map((row) => String(row.policy_id)))
        );
      }

      if (assessmentsRes.error) {
        setAssessmentsError(assessmentsRes.error.message);
        setAssessments([]);
      } else {
        setAssessments((assessmentsRes.data ?? []) as CompanyAssessment[]);
      }

      setAssessmentsLoading(false);
    };

    loadUserWorkspace();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleNavigate = (section: NavSection) => {
    setActiveSection(section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    setTableTab('all');
  };

  const handleToggleWatchlist = async (policyId: string) => {
    setActionError(null);

    if (!isSupabaseConfigured || !supabase) {
      setSetupModalOpen(true);
      return;
    }

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setPendingWatchlistId(policyId);
    const currentlySaved = watchlistIds.has(policyId);

    try {
      if (currentlySaved) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('policy_id', policyId);

        if (error) {
          setActionError(error.message);
        } else {
          setWatchlistIds((prev) => {
            const next = new Set(prev);
            next.delete(policyId);
            return next;
          });
        }
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({ user_id: user.id, policy_id: policyId });

        if (error) {
          setActionError(error.message);
        } else {
          setWatchlistIds((prev) => {
            const next = new Set(prev);
            next.add(policyId);
            return next;
          });
        }
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to update watchlist.'
      );
    } finally {
      setPendingWatchlistId(null);
    }
  };

  const handleCreateAssessment = async (payload: {
    company_name: string;
    policy_id: string | null;
    rating: AssessmentRating;
    company_impact: string;
    market_outlook: string;
  }): Promise<boolean> => {
    if (!supabase || !user) return false;
    setAssessmentsError(null);

    const { data, error } = await supabase
      .from('company_assessments')
      .insert({
        user_id: user.id,
        company_name: payload.company_name,
        policy_id: payload.policy_id,
        rating: payload.rating,
        company_impact: payload.company_impact,
        market_outlook: payload.market_outlook,
      })
      .select('*')
      .single();

    if (error) {
      setAssessmentsError(error.message);
      return false;
    }

    if (data) {
      setAssessments((prev) => [data as CompanyAssessment, ...prev]);
    }
    return true;
  };

  const handleUpdateAssessment = async (
    id: string,
    payload: {
      company_name: string;
      policy_id: string | null;
      rating: AssessmentRating;
      company_impact: string;
      market_outlook: string;
    }
  ): Promise<boolean> => {
    if (!supabase || !user) return false;
    setAssessmentsError(null);

    const { data, error } = await supabase
      .from('company_assessments')
      .update({
        company_name: payload.company_name,
        policy_id: payload.policy_id,
        rating: payload.rating,
        company_impact: payload.company_impact,
        market_outlook: payload.market_outlook,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      setAssessmentsError(error.message);
      return false;
    }

    if (data) {
      setAssessments((prev) =>
        prev.map((item) => (item.id === id ? (data as CompanyAssessment) : item))
      );
    }
    return true;
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!supabase || !user) return;
    setAssessmentsError(null);

    const { error } = await supabase
      .from('company_assessments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setAssessmentsError(error.message);
      return;
    }

    setAssessments((prev) => prev.filter((item) => item.id !== id));
  };

  // Filtered policies by Search + Sector
  const filteredPolicies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return policies.filter((policy) => {
      const matchesSector =
        selectedSector === 'All' ||
        policy.sector.toLowerCase() === selectedSector.toLowerCase();

      if (!matchesSector) return false;
      if (!q) return true;

      return (
        policy.title.toLowerCase().includes(q) ||
        policy.authority.toLowerCase().includes(q) ||
        policy.state.toLowerCase().includes(q) ||
        policy.executive_summary.toLowerCase().includes(q)
      );
    });
  }, [policies, searchQuery, selectedSector]);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedSector !== 'All';

  return (
    <div className="min-h-screen bg-[#050507] text-[#F1F5F9]">
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        user={user}
        watchlistCount={watchlistIds.size}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
        {/* Configuration Notice when Supabase env vars are missing */}
        {!isSupabaseConfigured && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-[#0B0F19] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold text-white">
                  Supabase Environment Variables Required
                </p>
                <p className="mt-0.5 text-slate-400">
                  Set <code className="font-mono text-[#00F0FF]">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                  <code className="font-mono text-[#00F0FF]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
                  to load live policies, authentication, watchlist sync, and private assessments.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#1D4ED8]/45 bg-[#050507] px-4 text-xs font-semibold text-[#00F0FF] transition-colors hover:border-[#00F0FF] whitespace-nowrap shrink-0"
            >
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              <span>View SQL Schema</span>
            </button>
          </div>
        )}

        {actionError && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="font-medium text-rose-100 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section 1: Command Search & KPI Overview */}
        <KpiOverview
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSector={selectedSector}
          onSectorChange={setSelectedSector}
          policies={policies}
          watchlistIds={watchlistIds}
          loading={policiesLoading}
          isAuthenticated={Boolean(user)}
        />

        {/* Section 2: Upcoming Deadlines Strip */}
        <UpcomingDeadlines
          policies={policies}
          loading={policiesLoading}
          onSelectPolicy={(policy) => setSelectedPolicy(policy)}
        />

        {/* Section 3: Policy Intelligence Table & Watchlist */}
        <PolicyTable
          policies={filteredPolicies}
          watchlistIds={watchlistIds}
          activeTab={tableTab}
          onTabChange={setTableTab}
          onSelectPolicy={(policy) => setSelectedPolicy(policy)}
          onToggleWatchlist={handleToggleWatchlist}
          pendingWatchlistId={pendingWatchlistId}
          loading={policiesLoading}
          error={policiesError}
          isAuthenticated={Boolean(user)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onClearFilters={() => {
            setSearchQuery('');
            setSelectedSector('All');
          }}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Section 5: Private Company & Market Impact Lab */}
        <MarketLab
          user={user}
          policies={policies}
          assessments={assessments}
          loading={assessmentsLoading}
          error={assessmentsError}
          onOpenAuth={() => setAuthModalOpen(true)}
          onCreateAssessment={handleCreateAssessment}
          onUpdateAssessment={handleUpdateAssessment}
          onDeleteAssessment={handleDeleteAssessment}
        />

        {/* Section 6: Email Capture & Daily Digest Template Preview */}
        <DailyDigestSection policies={policies} />
      </main>

      <footer className="mt-12 border-t border-[#1D4ED8]/25 bg-[#050507] py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <span>VoltReg Intel · B2B Regulatory &amp; Clean Energy Market Intelligence</span>
          <button
            type="button"
            onClick={() => setSetupModalOpen(true)}
            className="text-slate-400 transition-colors hover:text-[#00F0FF]"
          >
            Supabase SQL Schema &amp; RLS Reference
          </button>
        </div>
      </footer>

      {/* Section 4: Executive Summary & Impact Inspector Drawer */}
      <PolicyInspectorDrawer
        policy={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        isSaved={selectedPolicy ? watchlistIds.has(selectedPolicy.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
        pendingWatchlist={
          selectedPolicy ? pendingWatchlistId === selectedPolicy.id : false
        }
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onOpenSetup={() => setSetupModalOpen(true)}
      />

      {/* Supabase Setup & SQL Schema Modal */}
      <SupabaseSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />
    </div>
  );
}
