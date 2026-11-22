export type ImpactLevel = 'High' | 'Medium' | 'Low';

export type SectorFilter =
  | 'All'
  | 'Solar'
  | 'Wind'
  | 'Green Hydrogen'
  | 'Storage/BESS'
  | 'Grid/Tariff';

export type AssessmentRating = 'Critical' | 'High' | 'Moderate' | 'Opportunity';

export type NavSection =
  | 'policy-feed'
  | 'upcoming-deadlines'
  | 'market-lab'
  | 'daily-digest';

export interface Policy {
  id: string;
  title: string;
  authority: string;
  state: string;
  sector: string;
  impact_level: ImpactLevel;
  deadline_date: string | null;
  executive_summary: string;
  business_impact: string;
  source_pdf_url: string | null;
  created_at?: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  policy_id: string;
  created_at?: string;
}

export interface CompanyAssessment {
  id: string;
  user_id: string;
  company_name: string;
  policy_id: string | null;
  rating: AssessmentRating;
  company_impact: string;
  market_outlook: string;
  created_at: string;
  updated_at?: string;
}

export interface Subscriber {
  id: string;
  email: string;
  created_at?: string;
}
