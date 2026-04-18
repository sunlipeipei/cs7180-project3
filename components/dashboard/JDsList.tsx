'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IngestJDResponse } from '@/ai/schemas';
import { tailorResume } from '@/services/resume.service';
import { formatRelative } from './_helpers';

interface Props {
  jds: IngestJDResponse[];
}

const SURFACE_LOW = 'var(--color-surface-container-low)';
const SURFACE_LOWEST = 'var(--color-surface-container-lowest)';

export function JDsList({ jds }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTailor(jobDescriptionId: string) {
    setActiveId(jobDescriptionId);
    setError(null);
    try {
      const resume = await tailorResume({ jobDescriptionId });
      router.push(`/tailor/${encodeURIComponent(resume.resumeId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tailoring failed');
      setActiveId(null);
    }
  }

  return (
    <section>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-headline)',
            color: 'var(--color-on-surface)',
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: 0,
          }}
        >
          Saved Jobs
        </h3>
        <Link
          href="/dashboard/new"
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-secondary)',
            textDecoration: 'none',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          + New
        </Link>
      </div>

      {/* Error banner (server error for the most recent Tailor attempt) */}
      {error && (
        <p
          role="alert"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-error, #ef4444)',
            margin: '0 0 0.75rem',
            fontFamily: 'var(--font-body)',
          }}
        >
          {error}
        </p>
      )}

      {/* List or empty state */}
      {jds.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-on-surface-variant)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            padding: '2rem 0',
          }}
        >
          No job descriptions yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {jds.map((jd, i) => (
            <div
              key={jd.jobDescriptionId}
              style={{
                backgroundColor: i % 2 === 0 ? SURFACE_LOW : SURFACE_LOWEST,
                borderRadius: 'var(--radius-xl)',
                padding: '1rem 1.25rem',
                marginBottom: i < jds.length - 1 ? '0.5rem' : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-headline)',
                    color: 'var(--color-on-surface)',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {jd.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-on-surface-variant)',
                    fontSize: '0.8125rem',
                    margin: '0.25rem 0 0',
                  }}
                >
                  <span data-testid={`jd-company-${jd.jobDescriptionId}`}>{jd.company}</span>
                  {' · '}
                  {formatRelative(jd.parsedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTailor(jd.jobDescriptionId)}
                disabled={activeId !== null}
                aria-label={`Tailor resume for ${jd.title}`}
                style={{
                  flexShrink: 0,
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--color-secondary)',
                  color: 'var(--color-on-secondary)',
                  fontFamily: 'var(--font-headline)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: activeId !== null ? 'not-allowed' : 'pointer',
                  border: 'none',
                  opacity: activeId !== null && activeId !== jd.jobDescriptionId ? 0.4 : 1,
                }}
              >
                {activeId === jd.jobDescriptionId ? 'Tailoring…' : 'Tailor'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
