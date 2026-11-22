import { AlertTriangle, CheckCircle2, Flame, Info, ShieldAlert } from 'lucide-react';
import type { AssessmentRating, ImpactLevel } from '../types/intelligence';

interface ImpactBadgeProps {
  level: ImpactLevel;
}

export function ImpactBadge({ level }: ImpactBadgeProps) {
  if (level === 'High') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 whitespace-nowrap shrink-0">
        <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" aria-hidden="true" />
        <span>High</span>
      </span>
    );
  }

  if (level === 'Medium') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-[#3B82F6]/45 bg-[#3B82F6]/15 px-2.5 py-1 text-xs font-medium text-[#93C5FD] whitespace-nowrap shrink-0">
        <AlertTriangle className="h-3.5 w-3.5 text-[#3B82F6] shrink-0" aria-hidden="true" />
        <span>Medium</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-slate-600/50 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300 whitespace-nowrap shrink-0">
      <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      <span>Low</span>
    </span>
  );
}

interface RatingBadgeProps {
  rating: AssessmentRating;
}

export function RatingBadge({ rating }: RatingBadgeProps) {
  if (rating === 'Critical') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-rose-500/45 bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-300 whitespace-nowrap shrink-0">
        <Flame className="h-3.5 w-3.5 text-rose-400 shrink-0" aria-hidden="true" />
        <span>Critical</span>
      </span>
    );
  }

  if (rating === 'High') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 whitespace-nowrap shrink-0">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
        <span>High</span>
      </span>
    );
  }

  if (rating === 'Opportunity') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-[#00F0FF]/45 bg-[#00F0FF]/10 px-2.5 py-1 text-xs font-medium text-[#00F0FF] whitespace-nowrap shrink-0">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#00F0FF] shrink-0" aria-hidden="true" />
        <span>Opportunity</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-[#3B82F6]/45 bg-[#3B82F6]/15 px-2.5 py-1 text-xs font-medium text-[#93C5FD] whitespace-nowrap shrink-0">
      <Info className="h-3.5 w-3.5 text-[#3B82F6] shrink-0" aria-hidden="true" />
      <span>Moderate</span>
    </span>
  );
}
