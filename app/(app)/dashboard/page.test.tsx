/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { MasterProfile, IngestJDResponse, TailoredResume } from '@/ai/schemas';

// --- Mock next/navigation and next/link before any imports ---
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

// --- Mock the three services ---
vi.mock('@/services/profile.service', () => ({
  getProfile: vi.fn(),
}));
vi.mock('@/services/jobDescription.service', () => ({
  listJobDescriptions: vi.fn(),
}));
vi.mock('@/services/resume.service', () => ({
  listResumes: vi.fn(),
}));

import { getProfile } from '@/services/profile.service';
import { listJobDescriptions } from '@/services/jobDescription.service';
import { listResumes } from '@/services/resume.service';
import DashboardPage from './page';

// Clear call counts before each test so spy call counts don't bleed across tests
beforeEach(() => {
  vi.clearAllMocks();
});

const mockProfile: MasterProfile = {
  schemaVersion: 1,
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
  phone: '+14155550192',
  skills: [{ name: 'TypeScript' }],
  workExperience: [
    { company: 'Stripe', title: 'SWE', startDate: '2022-01-01', descriptions: [] },
  ],
  education: [{ school: 'Waterloo', degree: 'BS' }],
};

const mockJDs: IngestJDResponse[] = [
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

const mockResumes: TailoredResume[] = [
  {
    resumeId: 'd4e5f6a7-b8c9-4012-8efa-123456789012',
    jobDescriptionId: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
    header: '# Jordan Lee',
    summary: 'Summary',
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
    projects: 'Projects',
    updatedAt: '2025-03-16T17:22:00.000Z',
  },
];

beforeEach(() => {
  vi.mocked(getProfile).mockResolvedValue(mockProfile);
  vi.mocked(listJobDescriptions).mockResolvedValue(mockJDs);
  vi.mocked(listResumes).mockResolvedValue(mockResumes);
});

describe('DashboardPage', () => {
  it('renders a loading skeleton before data resolves', async () => {
    // Make services hang so we can catch the loading state
    vi.mocked(getProfile).mockImplementation(() => new Promise(() => {}));
    vi.mocked(listJobDescriptions).mockImplementation(() => new Promise(() => {}));
    vi.mocked(listResumes).mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('renders the "Dashboard" hero heading after data loads', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  it('renders profile name and email after data loads', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
      expect(screen.getByText('jordan.lee@example.com')).toBeInTheDocument();
    });
  });

  it('renders the profile completeness percentage', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('renders the correct number of JD cards', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Senior Software Engineer, Google Cloud Platform'),
      ).toBeInTheDocument();
      expect(screen.getByText('Staff Engineer – Platform')).toBeInTheDocument();
    });
  });

  it('renders the correct number of resume cards', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const resumeLinks = screen
        .getAllByRole('link')
        .filter((el) => el.getAttribute('href')?.startsWith('/tailor/'));
      expect(resumeLinks).toHaveLength(1);
    });
  });

  it('resume links point to /tailor/[resumeId]', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /resume for senior software engineer/i });
      expect(link).toHaveAttribute('href', '/tailor/d4e5f6a7-b8c9-4012-8efa-123456789012');
    });
  });

  it('renders "No job descriptions yet" empty state when JDs list is empty', async () => {
    vi.mocked(listJobDescriptions).mockResolvedValue([]);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/no job descriptions yet/i)).toBeInTheDocument();
    });
  });

  it('renders "No resumes yet" empty state when resumes list is empty', async () => {
    vi.mocked(listResumes).mockResolvedValue([]);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/no resumes yet/i)).toBeInTheDocument();
    });
  });

  it('renders all three sections: profile, saved jobs, resumes', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/saved jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/resumes/i)).toBeInTheDocument();
      // Profile card includes the name
      expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    });
  });

  it('calls all three services exactly once on mount', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    });
    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(listJobDescriptions).toHaveBeenCalledTimes(1);
    expect(listResumes).toHaveBeenCalledTimes(1);
  });
});
