import { AlertCircle, CheckCircle2, Loader2, Lock, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSetup?: () => void;
}

export function AuthModal({ isOpen, onClose, onOpenSetup }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.'
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorMessage(error.message);
        } else {
          setEmail('');
          setPassword('');
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorMessage(error.message);
        } else if (data.session) {
          setEmail('');
          setPassword('');
          onClose();
        } else {
          setSuccessMessage(
            'Account created. Check your inbox for the Supabase confirmation link before signing in.'
          );
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to reach Supabase authentication.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md rounded-xl border border-[#1D4ED8]/40 bg-[#0B0F19] p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00F0FF]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#1D4ED8]/40 bg-[#050507] text-[#00F0FF]">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-semibold text-white">
            {mode === 'login' ? 'Sign in to VoltReg Intel' : 'Create Analyst Account'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Access your private company impact assessments and persistent regulatory watchlist.
          </p>
        </div>

        {/* Segmented Auth Mode Switch */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-[#1D4ED8]/30 bg-[#050507] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`h-9 rounded-md text-xs font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-[#3B82F6] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`h-9 rounded-md text-xs font-semibold transition-colors ${
              mode === 'signup'
                ? 'bg-[#3B82F6] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
            <div className="space-y-1">
              <p>{errorMessage}</p>
              {!isSupabaseConfigured && onOpenSetup && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSetup();
                  }}
                  className="font-semibold text-[#00F0FF] underline underline-offset-2 hover:text-white"
                >
                  View Supabase Setup & SQL Schema
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[#00F0FF]/40 bg-[#00F0FF]/10 p-3 text-xs text-slate-100">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00F0FF]" aria-hidden="true" />
            <p>{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-slate-300">
              Work Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@company.com"
              className="h-11 w-full rounded-lg border border-[#1D4ED8]/35 bg-[#050507] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="h-11 w-full rounded-lg border border-[#1D4ED8]/35 bg-[#050507] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#00F0FF] px-4 text-sm font-semibold text-[#050507] transition-colors hover:bg-[#38F5FF] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>
              {submitting
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
