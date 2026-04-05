import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-8 py-24 text-center"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <p
        className="mb-2 text-xs font-medium uppercase tracking-widest"
        style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-label)' }}
      >
        BypassHire
      </p>
      <h1
        className="mb-4 text-4xl font-semibold"
        style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
      >
        Ready to tailor your resume?
      </h1>
      <p className="mb-10 max-w-md text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
        Paste a job description or provide a URL. We&apos;ll analyze it and tailor your resume in
        under 5 minutes.
      </p>

      <Link
        href="/dashboard/new"
        className="rounded-xl px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          backgroundColor: 'var(--color-secondary)',
          color: 'var(--color-on-secondary)',
          fontFamily: 'var(--font-label)',
        }}
      >
        New Project →
      </Link>
    </div>
  );
}
