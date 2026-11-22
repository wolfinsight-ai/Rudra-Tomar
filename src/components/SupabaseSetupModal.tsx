import { Check, Copy, Database, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SUPABASE_SCHEMA_SQL } from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseSetupModal({ isOpen, onClose }: SupabaseSetupModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-modal-title"
    >
      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-[#1D4ED8]/40 bg-[#0B0F19] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1D4ED8]/30 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-[#00F0FF]" aria-hidden="true" />
            <h2 id="setup-modal-title" className="text-lg font-semibold text-white">
              Supabase Schema & Environment Setup
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup guide"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5 subtle-scroll">
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              Configure <code className="font-mono text-[#00F0FF]">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
              and <code className="font-mono text-[#00F0FF]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
              in your environment variables, then run the SQL below in the Supabase SQL Editor to
              create <code className="font-mono text-slate-200">policies</code>,{' '}
              <code className="font-mono text-slate-200">watchlist</code>,{' '}
              <code className="font-mono text-slate-200">company_assessments</code> (with strict
              per-user RLS), and <code className="font-mono text-slate-200">subscribers</code>.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#1D4ED8]/30 bg-[#050507]">
            <div className="flex items-center justify-between border-b border-[#1D4ED8]/25 px-4 py-2.5">
              <span className="font-mono text-xs text-slate-400">schema.sql</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded border border-[#1D4ED8]/40 bg-[#0B0F19] px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-[#00F0FF]/50 hover:text-[#00F0FF]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-[420px] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 subtle-scroll">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
