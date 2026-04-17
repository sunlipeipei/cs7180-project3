'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type InputMode = 'text' | 'url';

export default function NewProjectPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>('text');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/job-descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        const ct = res.headers.get('content-type') ?? '';
        const data = ct.includes('application/json') ? await res.json() : {};
        throw new Error(data.error ?? `Server error (${res.status})`);
      }

      const jd = await res.json();
      router.push(`/dashboard?jd=${jd.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-12" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div className="mb-10">
        <p
          className="mb-1 text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-label)' }}
        >
          Section 01
        </p>
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
        >
          New Project Setup
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          Paste a job description or provide a URL to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Input mode toggle */}
        <div>
          <p
            className="mb-3 text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-label)' }}
          >
            Section 02 — Job Description
          </p>

          <div
            className="mb-4 inline-flex gap-1 rounded-xl p-1"
            style={{ backgroundColor: 'var(--color-surface-container-high)' }}
          >
            {(['text', 'url'] as InputMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setInput('');
                  setError(null);
                }}
                className="rounded-lg px-5 py-1.5 text-sm font-medium transition-colors"
                style={
                  mode === m
                    ? {
                        backgroundColor: 'var(--color-surface-container-lowest)',
                        color: 'var(--color-secondary)',
                      }
                    : { color: 'var(--color-on-surface-variant)' }
                }
              >
                {m === 'text' ? 'Paste Text' : 'Enter URL'}
              </button>
            ))}
          </div>

          {mode === 'text' ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={12}
              required
              className="w-full resize-none rounded-xl px-5 py-4 text-sm outline-none transition-all placeholder:opacity-40 focus:ring-1"
              style={{
                backgroundColor: 'var(--color-surface-container-high)',
                color: 'var(--color-on-surface)',
                borderBottom: '2px solid transparent',
                fontFamily: 'var(--font-body)',
                lineHeight: '1.7',
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'var(--color-secondary)')}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
            />
          ) : (
            <div className="space-y-2">
              <input
                type="url"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://jobs.example.com/senior-engineer"
                required
                className="w-full rounded-xl px-5 py-4 text-sm outline-none transition-all placeholder:opacity-40"
                style={{
                  backgroundColor: 'var(--color-surface-container-high)',
                  color: 'var(--color-on-surface)',
                  borderBottom: '2px solid transparent',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderBottomColor = 'var(--color-secondary)')
                }
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
              />
              <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                Works best with static job boards. LinkedIn and Workday require manual paste.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-5 py-3 text-sm"
            style={{
              backgroundColor: 'var(--color-error-container)',
              color: 'var(--color-on-error-container)',
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl px-8 py-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-on-secondary)',
              fontFamily: 'var(--font-label)',
            }}
          >
            {loading ? 'Analyzing…' : 'Start Tailoring →'}
          </button>

          {loading && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              {/* Progress bar */}
              <div
                className="h-0.5 w-32 overflow-hidden rounded-full"
                style={{ backgroundColor: 'var(--color-surface-variant)' }}
              >
                <div
                  className="h-full animate-pulse rounded-full"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    boxShadow: '0 0 10px var(--color-secondary)',
                    width: '60%',
                  }}
                />
              </div>
              Fetching &amp; parsing…
            </div>
          )}
        </div>

        {/* Security note */}
        <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)', opacity: 0.6 }}>
          🔒 Encrypted processing — your job description is never stored unencrypted.
        </p>
      </form>
    </div>
  );
}
