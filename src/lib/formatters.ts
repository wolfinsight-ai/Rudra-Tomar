import type { AssessmentRating, ImpactLevel, SectorFilter } from '../types/intelligence';

export const SECTOR_FILTERS: SectorFilter[] = [
  'All',
  'Solar',
  'Wind',
  'Green Hydrogen',
  'Storage/BESS',
  'Grid/Tariff',
];

export const ASSESSMENT_RATINGS: AssessmentRating[] = [
  'Critical',
  'High',
  'Moderate',
  'Opportunity',
];

export const SUGGESTED_COMPANIES: string[] = [
  'ReNew Energy Global (IPP)',
  'Adani Green Energy (IPP)',
  'Tata Power Solar (Module / EPC)',
  'Waaree Energies (Module Maker)',
  'MSEDCL (State DISCOM)',
  'NTPC Green Energy (Utility)',
];

/**
 * Computes whole days remaining from today (local midnight) until target ISO date.
 * Returns null if dateString is empty or invalid.
 */
export function getDaysRemaining(dateString: string | null): number | null {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetMidnight = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  ).getTime();

  return Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
}

export function formatShortDate(dateString: string | null): string {
  if (!dateString) return 'No deadline';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return 'Invalid date';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDeadlineCountdown(days: number | null): string {
  if (days === null) return 'No date set';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/**
 * Ensures external PDF URLs only allow http/https protocols.
 */
export function sanitizeExternalUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeImpactLevel(value: string | null | undefined): ImpactLevel {
  const lower = (value ?? '').toLowerCase();
  if (lower === 'high') return 'High';
  if (lower === 'low') return 'Low';
  return 'Medium';
}
