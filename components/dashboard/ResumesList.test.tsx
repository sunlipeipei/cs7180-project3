/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResumesList } from './ResumesList';
import type { TailoredResume, IngestJDResponse } from '@/ai/schemas';

const jds: IngestJDResponse[] = [
  {
    jobDescriptionId: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
    title: 'Senior Software Engineer, Google Cloud Platform',
    company: 'Google',
    parsedAt: '2025-03-15T10:30:00.000Z',
  },
];

const resumes: TailoredResume[] = [
  {
    resumeId: 'd4e5f6a7-b8c9-4012-8efa-123456789012',
    jobDescriptionId: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
    header: '# Jordan Lee',
    summary: 'Summary text',
    skills: 'Skills text',
    experience: 'Experience text',
    education: 'Education text',
    projects: 'Projects text',
    updatedAt: '2025-03-16T17:22:00.000Z',
  },
  {
    resumeId: 'c3d4e5f6-a7b8-4901-8def-012345678901',
    jobDescriptionId: 'f7e6d5c4-b3a2-4198-89ab-543210fedcba', // no matching JD
    header: '# Jordan Lee',
    summary: 'Summary 2',
    skills: 'Skills 2',
    experience: 'Experience 2',
    education: 'Education 2',
    projects: 'Projects 2',
    updatedAt: '2025-03-14T09:00:00.000Z',
  },
];

describe('ResumesList', () => {
  it('renders section header "Resumes"', () => {
    render(<ResumesList resumes={resumes} jds={jds} />);
    expect(screen.getByText(/resumes/i)).toBeInTheDocument();
  });

  it('renders a card for each resume', () => {
    render(<ResumesList resumes={resumes} jds={jds} />);
    // Two cards should be rendered
    const links = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href')?.startsWith('/tailor/'));
    expect(links).toHaveLength(2);
  });

  it('builds link to /tailor/[resumeId] for each resume', () => {
    render(<ResumesList resumes={resumes} jds={jds} />);
    expect(
      screen.getByRole('link', { name: /resume for senior software engineer/i })
    ).toHaveAttribute('href', '/tailor/d4e5f6a7-b8c9-4012-8efa-123456789012');
  });

  it('shows derived title "Resume for {JD title}" when JD is found', () => {
    render(<ResumesList resumes={resumes} jds={jds} />);
    // The title appears as a heading paragraph — use getAllByText since the link also uses the title
    const matches = screen.getAllByText(
      'Resume for Senior Software Engineer, Google Cloud Platform'
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows fallback title when no matching JD is found', () => {
    render(<ResumesList resumes={resumes} jds={jds} />);
    // Second resume has no matching JD — appears in both <p> and <a>, use getAllByText
    const matches = screen.getAllByText(/resume \(unknown job\)/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when resumes is an empty array', () => {
    render(<ResumesList resumes={[]} jds={jds} />);
    expect(screen.getByText(/no resumes yet/i)).toBeInTheDocument();
  });

  it('does not render empty state when list has items', () => {
    render(<ResumesList resumes={resumes} jds={jds} />);
    expect(screen.queryByText(/no resumes yet/i)).not.toBeInTheDocument();
  });
});
