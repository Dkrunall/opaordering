'use client';

import { useState, useTransition } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { signIn } from '@/lib/actions/auth';
import { WarningIcon } from '@/components/icons';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await signIn(email, password);
      } catch (err) {
        unstable_rethrow(err);
        setError(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-amber-200/80 uppercase tracking-wider">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@opabar.com"
          className="w-full rounded-2xl border border-amber-500/20 bg-black/40 px-4 py-3 text-sm text-amber-50 placeholder-amber-400/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-amber-200/80 uppercase tracking-wider">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-2xl border border-amber-500/20 bg-black/40 px-4 py-3 text-sm text-amber-50 placeholder-amber-400/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-medium text-rose-300">
          <WarningIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-3.5 text-center text-sm font-extrabold text-black shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-all"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            Authenticating...
          </span>
        ) : (
          'Sign In to Dashboard'
        )}
      </button>
    </form>
  );
}

