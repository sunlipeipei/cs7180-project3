import Link from 'next/link';
import type { IngestJDResponse } from '@/ai/schemas';
import { formatRelative } from './_helpers';

interface Props {
  jds: IngestJDResponse[];
}

const SURFACE_LOW = 'var(--color-surface-container-low)';
const SURFACE_LOWEST = 'var(--color-surface-container-lowest)';

export function JDsList({ jds }: Props) {
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
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-headline)',
                  color: 'var(--color-on-surface)',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  margin: 0,
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
          ))}
        </div>
      )}
    </section>
  );
}
