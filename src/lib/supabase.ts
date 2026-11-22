import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl =
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  '';

const rawAnonKey =
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  '';

const supabaseUrl = rawUrl.trim();
const supabaseAnonKey = rawAnonKey.trim();

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured: boolean =
  isValidHttpUrl(supabaseUrl) &&
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-supabase-anon-key');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const SUPABASE_SCHEMA_SQL = `-- VoltReg Intel — Supabase PostgreSQL Schema & Row-Level Security
create extension if not exists "pgcrypto";

-- 1. Publicly readable regulatory policies
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authority text not null,
  state text not null,
  sector text not null,
  impact_level text not null check (impact_level in ('High', 'Medium', 'Low')),
  deadline_date date,
  executive_summary text not null,
  business_impact text not null,
  source_pdf_url text,
  created_at timestamptz not null default now()
);

alter table public.policies enable row level security;
create policy "Policies are readable by everyone"
  on public.policies for select
  using (true);

-- 2. User-scoped policy watchlist
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, policy_id)
);

alter table public.watchlist enable row level security;
create policy "Users can view their own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);
create policy "Users can add to their own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);
create policy "Users can remove from their own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);

-- 3. Private Company & Market Impact Lab (strict RLS per user)
create table if not exists public.company_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  policy_id uuid references public.policies(id) on delete set null,
  rating text not null check (rating in ('Critical', 'High', 'Moderate', 'Opportunity')),
  company_impact text not null,
  market_outlook text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_assessments enable row level security;
create policy "Users can view their own assessments"
  on public.company_assessments for select
  using (auth.uid() = user_id);
create policy "Users can insert their own assessments"
  on public.company_assessments for insert
  with check (auth.uid() = user_id);
create policy "Users can update their own assessments"
  on public.company_assessments for update
  using (auth.uid() = user_id);
create policy "Users can delete their own assessments"
  on public.company_assessments for delete
  using (auth.uid() = user_id);

-- 4. Daily Digest email subscribers
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;
create policy "Anyone can subscribe to the daily digest"
  on public.subscribers for insert
  with check (true);
`;
