import Link from 'next/link';
import type { MasterProfile } from '@/ai/schemas';
import { computeProfileCompleteness } from './_helpers';

interface Props {
  profile: MasterProfile | null;
}

export function ProfileStatusCard({ profile }: Props) {
  if (!profile) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-headline)',
            color: 'var(--color-on-surface)',
            fontSize: '1.125rem',
            fontWeight: 600,
            margin: 0,
          }}
        >
          No profile yet
        </h2>
        <p
          style={{
            color: 'var(--color-on-surface-variant)',
            fontSize: '0.875rem',
            margin: '0.25rem 0 0.75rem',
            fontFamily: 'var(--font-body)',
          }}
        >
          Import a resume PDF or fill out your master profile to get started.
        </p>
        <Link
          href="/profile"
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-secondary)',
            textDecoration: 'none',
            letterSpacing: '0.05em',
          }}
        >
          Create profile
        </Link>
      </div>
    );
  }

  const completeness = computeProfileCompleteness(profile);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem', // Scale 5
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-headline)',
              color: 'var(--color-on-surface)',
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {profile.name}
          </h2>
          <p
            style={{
              color: 'var(--color-on-surface-variant)',
              fontSize: '0.875rem',
              margin: '0.25rem 0 0',
              fontFamily: 'var(--font-body)',
            }}
          >
            {profile.email}
          </p>
        </div>
        <Link
          href="/profile"
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-secondary)',
            textDecoration: 'none',
            letterSpacing: '0.05em',
          }}
        >
          Edit profile
        </Link>
      </div>

      <div
        style={{
          marginTop: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '2px',
            backgroundColor: 'var(--color-surface-variant)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${completeness}%`,
              backgroundColor: 'var(--color-secondary)',
              boxShadow: '0 0 10px var(--color-secondary)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-on-surface)',
            minWidth: '3rem',
            textAlign: 'right',
          }}
        >
          {completeness}%
        </span>
      </div>
    </div>
  );
}
