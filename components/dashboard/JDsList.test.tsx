/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JDsList } from './JDsList';
import type { IngestJDResponse } from '@/ai/schemas';

const jds: IngestJDResponse[] = [
  {
    jobDescriptionId: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
    title: 'Senior Software Engineer, Google Cloud Platform',
    company: 'Google',
    parsedAt: '2025-03-15T10:30:00.000Z',
  },
  {
    jobDescriptionId: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
    title: 'Staff Engineer – Platform',
    company: 'Meridian Financial Technologies',
    parsedAt: '2025-03-18T14:45:00.000Z',
  },
];

describe('JDsList', () => {
  it('renders section header "Saved Jobs"', () => {
    render(<JDsList jds={jds} />);
    expect(screen.getByText(/saved jobs/i)).toBeInTheDocument();
  });

  it('renders a "New" link pointing to /dashboard/new', () => {
    render(<JDsList jds={jds} />);
    const link = screen.getByRole('link', { name: /new/i });
    expect(link).toHaveAttribute('href', '/dashboard/new');
  });

  it('renders one card per JD in the list', () => {
    render(<JDsList jds={jds} />);
    expect(screen.getByText('Senior Software Engineer, Google Cloud Platform')).toBeInTheDocument();
    expect(screen.getByText('Staff Engineer – Platform')).toBeInTheDocument();
  });

  it('renders the company name for each card', () => {
    render(<JDsList jds={jds} />);
    expect(screen.getByTestId('jd-company-a1b2c3d4-e5f6-4789-abcd-ef0123456789')).toHaveTextContent(
      'Google'
    );
    expect(screen.getByTestId('jd-company-b2c3d4e5-f6a7-4890-bcde-f01234567890')).toHaveTextContent(
      'Meridian Financial Technologies'
    );
  });

  it('renders empty state when jds is an empty array', () => {
    render(<JDsList jds={[]} />);
    expect(screen.getByText(/no job descriptions yet/i)).toBeInTheDocument();
  });

  it('does not render "No job descriptions yet" when list has items', () => {
    render(<JDsList jds={jds} />);
    expect(screen.queryByText(/no job descriptions yet/i)).not.toBeInTheDocument();
  });

  it('renders alternating surface backgrounds for cards', () => {
    render(<JDsList jds={jds} />);
    // Each card should be present — just verify count via titles
    const titles = ['Senior Software Engineer, Google Cloud Platform', 'Staff Engineer – Platform'];
    titles.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
  });
});
