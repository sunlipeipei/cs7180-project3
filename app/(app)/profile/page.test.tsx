/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MasterProfile } from '@/ai/schemas.js';

// vi.mock is hoisted to top-of-file — define the fixture inline so it is
// available before any const declarations below.
const mockProfile: MasterProfile = {
  schemaVersion: 1,
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1-555-000-0001',
  summary: 'A seasoned engineer.',
  links: {
    github: 'https://github.com/testuser',
    linkedin: 'https://linkedin.com/in/testuser',
    portfolio: 'https://testuser.dev',
  },
  skills: [{ name: 'TypeScript', category: 'Languages', level: 'Expert' }],
  workExperience: [
    {
      company: 'Acme Corp',
      title: 'Senior Engineer',
      startDate: '2020-01-01',
      endDate: null,
      descriptions: ['Built things.'],
    },
  ],
  education: [
    {
      school: 'State University',
      degree: 'B.S.',
      fieldOfStudy: 'Computer Science',
      startDate: '2014-09-01',
      endDate: '2018-05-01',
      gpa: '3.9',
    },
  ],
  projects: [
    {
      name: 'MyProject',
      description: 'A cool project.',
      technologies: ['React'],
      url: 'https://myproject.com',
    },
  ],
  certifications: [
    {
      name: 'AWS Certified',
      issuer: 'Amazon',
      date: '2022-01-01',
    },
  ],
};

// Factory must not reference outer-scope `const` — use vi.fn() with no default;
// beforeEach sets the resolved value.
vi.mock('@/services/profile.service', () => ({
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

import ProfilePage from './page';
import { getProfile, saveProfile } from '@/services/profile.service';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.mocked(getProfile).mockResolvedValue({ ...mockProfile });
    vi.mocked(saveProfile).mockImplementation(async (p) => p);
  });

  async function renderAndWait() {
    const utils = render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    return utils;
  }

  it('shows a loading state before profile resolves', async () => {
    let resolve: (v: MasterProfile) => void = () => {};
    vi.mocked(getProfile).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      })
    );
    render(<ProfilePage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    act(() => resolve(mockProfile));
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
  });

  it('renders profile content after load', async () => {
    await renderAndWait();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
  });

  it('renders Personal Info tab with phone, github, and portfolio fields', async () => {
    await renderAndWait();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/github/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/portfolio/i)).toBeInTheDocument();
  });

  it('renders Summary tab content', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole('tab', { name: /summary/i }));
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument();
  });

  it('renders Experience tab with split date inputs', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole('tab', { name: /experience/i }));
    const startDateInputs = screen.getAllByLabelText(/start date/i);
    expect(startDateInputs.length).toBeGreaterThan(0);
    const endDateInputs = screen.getAllByLabelText(/end date/i);
    expect(endDateInputs.length).toBeGreaterThan(0);
  });

  it('renders Education tab', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole('tab', { name: /education/i }));
    expect(screen.getByDisplayValue('State University')).toBeInTheDocument();
  });

  it('renders Projects tab', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole('tab', { name: /projects/i }));
    expect(screen.getByDisplayValue('MyProject')).toBeInTheDocument();
  });

  it('renders Certifications tab', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole('tab', { name: /certifications/i }));
    expect(screen.getByDisplayValue('AWS Certified')).toBeInTheDocument();
  });

  it('does not render a Certification URL field (not in schema)', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    await user.click(screen.getByRole('tab', { name: /certifications/i }));
    expect(screen.queryByLabelText(/certification url/i)).not.toBeInTheDocument();
  });

  it('sticky action bar uses --sidebar-width CSS variable for left and width', async () => {
    const { container } = await renderAndWait();
    const saveBtn = screen.getByRole('button', { name: /save profile/i });
    const bar = saveBtn.closest('div') as HTMLElement;
    const styleAttr = bar.getAttribute('style') ?? '';
    expect(styleAttr).toContain('var(--sidebar-width)');
  });

  it('renders Raw JSON tab with a <pre> element and Copy button', async () => {
    const user = userEvent.setup();
    const { container } = await renderAndWait();
    await user.click(screen.getByRole('tab', { name: /raw json/i }));
    const pre = container.querySelector('[data-testid="raw-json-pre"]');
    expect(pre).not.toBeNull();
    expect(pre!.tagName.toLowerCase()).toBe('pre');
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('has no "Edit JSON" button anywhere', async () => {
    await renderAndWait();
    expect(screen.queryByRole('button', { name: /edit json/i })).not.toBeInTheDocument();
  });

  it('Discard button is disabled when pristine', async () => {
    await renderAndWait();
    const discard = screen.getByRole('button', { name: /discard/i });
    expect(discard).toBeDisabled();
  });

  it('editing a field enables Save button and enables Discard button', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated User');
    const save = screen.getByRole('button', { name: /save profile/i });
    expect(save).not.toBeDisabled();
    const discard = screen.getByRole('button', { name: /discard/i });
    expect(discard).not.toBeDisabled();
  });

  it('clicking Save calls saveProfile with current state', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated User');
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    await waitFor(() => expect(saveProfile).toHaveBeenCalled());
    const call = vi.mocked(saveProfile).mock.calls[0][0];
    expect(call.name).toBe('Updated User');
  });

  it('shows inline "Saved" confirmation after successful save', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated User');
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    await waitFor(() => expect(screen.getByText(/^saved$/i)).toBeInTheDocument());
  });

  it('clicking Discard resets state to last-saved profile', async () => {
    const user = userEvent.setup();
    await renderAndWait();
    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated User');
    const discard = screen.getByRole('button', { name: /discard/i });
    await user.click(discard);
    await waitFor(() => expect(screen.getByDisplayValue('Test User')).toBeInTheDocument());
  });
});
