'use client';

import { useEffect, useState } from 'react';
import { getProfile } from '@/services/profile.service';
import { listJobDescriptions } from '@/services/jobDescription.service';
import { listResumes } from '@/services/resume.service';
import type { MasterProfile, IngestJDResponse, TailoredResume } from '@/ai/schemas';
import { ProfileStatusCard } from '@/components/dashboard/ProfileStatusCard';
import { JDsList } from '@/components/dashboard/JDsList';
import { ResumesList } from '@/components/dashboard/ResumesList';

interface DashboardData {
  profile: MasterProfile;
  jds: IngestJDResponse[];
  resumes: TailoredResume[];
}

function DashboardSkeleton() {
  return (
    <div
      data-testid="dashboard-loading"
      style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Hero skeleton */}
      <div
        style={{
          height: '2.5rem',
          width: '12rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-surface-container)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* Profile card skeleton */}
      <div
        style={{
          height: '7rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-surface-container-low)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* JD list skeleton */}
      <div
        style={{
          height: '10rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-surface-container-low)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* Resumes skeleton */}
      <div
        style={{
          height: '8rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-surface-container-low)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    Promise.all([getProfile(), listJobDescriptions(), listResumes()]).then(
      ([profile, jds, resumes]) => {
        setData({ profile, jds, resumes });
      }
    );
  }, []);

  if (!data) {
    return <DashboardSkeleton />;
  }

  const { profile, jds, resumes } = data;

  return (
    <div
      style={{
        padding: '2.5rem 2.5rem 4rem',
        maxWidth: '56rem',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Hero header */}
      <div style={{ marginBottom: '2.75rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-headline)',
            color: 'var(--color-on-surface)',
            fontSize: '2.25rem',
            fontWeight: 700,
            margin: '0 0 0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            color: 'var(--color-on-surface-variant)',
            fontSize: '0.9375rem',
            margin: 0,
          }}
        >
          Your resume workspace — tailored applications in under 5 minutes.
        </p>
      </div>

      {/* Section A — Profile status */}
      <div style={{ marginBottom: '2.75rem' }}>
        <ProfileStatusCard profile={profile} />
      </div>

      {/* Section B — Job Descriptions */}
      <div style={{ marginBottom: '2.75rem' }}>
        <JDsList jds={jds} />
      </div>

      {/* Section C — Resumes */}
      <div>
        <ResumesList resumes={resumes} jds={jds} />
      </div>
    </div>
  );
}
