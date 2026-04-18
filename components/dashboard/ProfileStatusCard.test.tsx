/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileStatusCard } from './ProfileStatusCard';
import type { MasterProfile } from '@/ai/schemas';

function makeProfile(overrides: Partial<MasterProfile> = {}): MasterProfile {
  return {
    schemaVersion: 1,
    name: 'Jordan Lee',
    email: 'jordan.lee@example.com',
    phone: '+14155550192',
    skills: [{ name: 'TypeScript' }],
    workExperience: [
      { company: 'Stripe', title: 'SWE', startDate: '2022-01-01', descriptions: [] },
    ],
    education: [{ school: 'Waterloo', degree: 'BS' }],
    ...overrides,
  };
}

describe('ProfileStatusCard', () => {
  it('renders the profile name', () => {
    render(<ProfileStatusCard profile={makeProfile()} />);
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
  });

  it('renders the profile email', () => {
    render(<ProfileStatusCard profile={makeProfile()} />);
    expect(screen.getByText('jordan.lee@example.com')).toBeInTheDocument();
  });

  it('renders completeness percentage as 100% when all fields filled', () => {
    render(<ProfileStatusCard profile={makeProfile()} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders completeness as 50% when skills/experience/education are empty', () => {
    const profile = makeProfile({ skills: [], workExperience: [], education: [] });
    render(<ProfileStatusCard profile={profile} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders an "Edit profile" link pointing to /profile', () => {
    render(<ProfileStatusCard profile={makeProfile()} />);
    const link = screen.getByRole('link', { name: /edit profile/i });
    expect(link).toHaveAttribute('href', '/profile');
  });
});
