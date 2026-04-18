import Link from 'next/link';
import type { TailoredResume, IngestJDResponse } from '@/ai/schemas';
import { formatRelative } from './_helpers';

interface Props {
  resumes: TailoredResume[];
  jds: IngestJDResponse[];
}

const SURFACE_LOW = 'var(--color-surface-container-low)';
const SURFACE_LOWEST = 'var(--color-surface-container-lowest)';

function deriveTitle(resume: TailoredResume, jds: IngestJDResponse[]): string {
  const jd = jds.find((j) => j.jobDescriptionId === resume.jobDescriptionId);
  if (jd) return `Resume for ${jd.title}`;
  return 'Resume (unknown job)';
}

export function ResumesList({ resumes, jds }: Props) {
  return (
    <section>
      {/* Section header */}
      <div style={{ marginBottom: '1.25rem' }}>
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
          Resumes
        </h3>
      </div>

      {/* List or empty state */}
      {resumes.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-on-surface-variant)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            padding: '2rem 0',
          }}
        >
          No resumes yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {resumes.map((resume, i) => {
            const title = deriveTitle(resume, jds);
            return (
              <div
                key={resume.resumeId}
                style={{
                  backgroundColor: i % 2 === 0 ? SURFACE_LOW : SURFACE_LOWEST,
                  borderRadius: 'var(--radius-xl)',
                  padding: '1rem 1.25rem',
                  marginBottom: i < resumes.length - 1 ? '0.5rem' : 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-headline)',
                      color: 'var(--color-on-surface)',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-on-surface-variant)',
                      fontSize: '0.8125rem',
                      margin: '0.25rem 0 0',
                    }}
                  >
                    {formatRelative(resume.updatedAt)}
                  </p>
                </div>
                <Link
                  href={`/tailor/${resume.resumeId}`}
                  style={{
                    fontFamily: 'var(--font-label)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-secondary)',
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Open →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
