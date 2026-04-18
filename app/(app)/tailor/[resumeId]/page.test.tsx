/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ── Service mocks ──────────────────────────────────────────────────────────────
vi.mock('@/services/resume.service', () => ({
  getResume: vi.fn(),
  refineSection: vi.fn(),
}));

vi.mock('@/services/jobDescription.service', () => ({
  getJobDescription: vi.fn(),
}));

// ── Next.js navigation mock ────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/tailor/test-resume-id'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// ── Next.js link mock ─────────────────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import * as resumeService from '@/services/resume.service';
import * as jdService from '@/services/jobDescription.service';
import TailorPage from './page';
import type { TailoredResume } from '@/ai/schemas';

// ── Fixture data ───────────────────────────────────────────────────────────────
const RESUME_ID = 'd4e5f6a7-b8c9-4012-8efa-123456789012';
const JD_ID = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';

const mockResume: TailoredResume = {
  resumeId: RESUME_ID,
  jobDescriptionId: JD_ID,
  header: '# Jordan Lee\njordan@example.com',
  summary: 'Senior engineer with 6+ years experience.',
  skills: '## Skills\nTypeScript, Go, Python',
  experience: '## Experience\nStripe, Shopify',
  education: '## Education\nB.S. CS — Waterloo',
  projects: '## Projects\nBypassHire, Temporal Graph',
  updatedAt: '2025-03-16T17:22:00.000Z',
};

const mockJD = {
  jobDescriptionId: JD_ID,
  title: 'Senior Software Engineer, Google Cloud Platform',
  company: 'Google',
  parsedAt: '2025-03-15T10:30:00.000Z',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function setupMocksWithResume() {
  vi.mocked(resumeService.getResume).mockResolvedValue(mockResume);
  vi.mocked(jdService.getJobDescription).mockResolvedValue(mockJD);
}

function setupMocksNotFound() {
  vi.mocked(resumeService.getResume).mockResolvedValue(null);
  vi.mocked(jdService.getJobDescription).mockResolvedValue(null);
}

/** Renders the page and waits until the editor is visible. */
async function renderAndWaitForEditor() {
  render(<TailorPage params={Promise.resolve({ resumeId: RESUME_ID })} />);
  // Wait until loading text is gone (editor loaded)
  await screen.findByLabelText(/summary/i, {}, { timeout: 3000 });
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('TailorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading + not-found ──────────────────────────────────────────────────────

  it('shows loading state initially', async () => {
    // getResume never resolves — stays loading
    vi.mocked(resumeService.getResume).mockReturnValue(new Promise(() => {}));
    vi.mocked(jdService.getJobDescription).mockReturnValue(new Promise(() => {}));

    await act(async () => {
      render(<TailorPage params={Promise.resolve({ resumeId: RESUME_ID })} />);
    });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders "Resume not found" state when getResume returns null', async () => {
    setupMocksNotFound();
    render(<TailorPage params={Promise.resolve({ resumeId: 'nonexistent-id' })} />);

    await screen.findByText(/resume not found/i, {}, { timeout: 3000 });
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });

  // ── Editor renders ───────────────────────────────────────────────────────────

  it('renders all 6 section textareas after loading', async () => {
    setupMocksWithResume();
    await renderAndWaitForEditor();

    // All 6 sections should have labeled textareas
    const sections = ['header', 'summary', 'skills', 'experience', 'education', 'projects'];
    for (const section of sections) {
      expect(screen.getByLabelText(new RegExp(section, 'i'))).toBeInTheDocument();
    }

    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBeGreaterThanOrEqual(6);
  });

  it('displays resume title in the header after JD loads', async () => {
    setupMocksWithResume();
    render(<TailorPage params={Promise.resolve({ resumeId: RESUME_ID })} />);
    await screen.findByText(/senior software engineer/i, {}, { timeout: 3000 });
  });

  it('populates textareas with section markdown content', async () => {
    setupMocksWithResume();
    await renderAndWaitForEditor();

    const summaryTextarea = screen.getByLabelText(/summary/i) as HTMLTextAreaElement;
    expect(summaryTextarea.value).toBe(mockResume.summary);
  });

  // ── Preview pane ─────────────────────────────────────────────────────────────

  it('renders a preview pane with concatenated markdown in a <pre> element', async () => {
    setupMocksWithResume();
    await renderAndWaitForEditor();

    const pre = screen.getByRole('document');
    expect(pre.tagName).toBe('PRE');
    expect(pre.textContent).toContain(mockResume.summary);
    expect(pre.textContent).toContain(mockResume.skills);
  });

  // ── Textarea local state ─────────────────────────────────────────────────────

  it('updates local state when a textarea is edited', async () => {
    const user = userEvent.setup();
    setupMocksWithResume();
    await renderAndWaitForEditor();

    const summaryTextarea = screen.getByLabelText(/summary/i) as HTMLTextAreaElement;
    await user.clear(summaryTextarea);
    await user.type(summaryTextarea, 'New summary text');

    expect(summaryTextarea.value).toBe('New summary text');
  });

  // ── PDF render stub ──────────────────────────────────────────────────────────

  it('PDF Render button logs and shows transient status on click', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    setupMocksWithResume();
    await renderAndWaitForEditor();

    await user.click(screen.getByRole('button', { name: /render pdf/i }));

    expect(consoleSpy).toHaveBeenCalledWith('[B2] PDF render requested', { resumeId: RESUME_ID });
    expect(screen.getByText(/pdf render requested/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('transient PDF status disappears after 2s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    setupMocksWithResume();

    // With fake timers, use real timers for the initial render only
    render(<TailorPage params={Promise.resolve({ resumeId: RESUME_ID })} />);

    // Wait for editor by advancing real microtasks
    await vi.runAllTimersAsync();

    await screen.findByLabelText(/summary/i, {}, { timeout: 3000 });

    await user.click(screen.getByRole('button', { name: /render pdf/i }));
    expect(screen.getByText(/pdf render requested/i)).toBeInTheDocument();

    // Advance 2s to clear the transient status
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    await waitFor(() => {
      expect(screen.queryByText(/pdf render requested/i)).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  // ── Refine dialog ────────────────────────────────────────────────────────────

  it('Refine button opens the dialog', async () => {
    const user = userEvent.setup();
    setupMocksWithResume();
    await renderAndWaitForEditor();

    await user.click(screen.getByRole('button', { name: /refine/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // section select
  });

  it('dialog contains a section select defaulting to summary', async () => {
    const user = userEvent.setup();
    setupMocksWithResume();
    await renderAndWaitForEditor();

    await user.click(screen.getByRole('button', { name: /refine/i }));

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('summary');
  });

  it('dialog contains an instruction textarea and submit/cancel buttons', async () => {
    const user = userEvent.setup();
    setupMocksWithResume();
    await renderAndWaitForEditor();

    await user.click(screen.getByRole('button', { name: /refine/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('textbox')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /submit/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('cancel button closes the dialog without calling refineSection', async () => {
    const user = userEvent.setup();
    setupMocksWithResume();
    await renderAndWaitForEditor();

    await user.click(screen.getByRole('button', { name: /refine/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(resumeService.refineSection).not.toHaveBeenCalled();
  });

  it('submitting refine calls refineSection with correct payload', async () => {
    const user = userEvent.setup();
    const updatedMarkdown = 'Updated summary text via refine.';
    vi.mocked(resumeService.refineSection).mockResolvedValue({
      resumeId: RESUME_ID,
      section: 'summary',
      updatedMarkdown,
      updatedAt: new Date().toISOString(),
    });
    setupMocksWithResume();
    await renderAndWaitForEditor();

    await user.click(screen.getByRole('button', { name: /refine/i }));

    const dialog = screen.getByRole('dialog');
    const instructionTextarea = within(dialog).getByRole('textbox');
    await user.type(instructionTextarea, 'Make it more concise');

    await user.click(within(dialog).getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(resumeService.refineSection).toHaveBeenCalledWith({
        resumeId: RESUME_ID,
        section: 'summary',
        instruction: 'Make it more concise',
      });
    });
  });

  it('on successful refine, updates the section textarea and closes dialog', async () => {
    const user = userEvent.setup();
    const updatedMarkdown = 'Refined: make it more concise';
    vi.mocked(resumeService.refineSection).mockResolvedValue({
      resumeId: RESUME_ID,
      section: 'summary',
      updatedMarkdown,
      updatedAt: new Date().toISOString(),
    });
    setupMocksWithResume();
    await renderAndWaitForEditor();

    await user.click(screen.getByRole('button', { name: /refine/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Make it concise');
    await user.click(within(dialog).getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const summaryTextarea = screen.getByLabelText(/summary/i) as HTMLTextAreaElement;
    expect(summaryTextarea.value).toBe(updatedMarkdown);
  });

  it('on successful refine, shows transient "Section refined" status', async () => {
    const user = userEvent.setup();
    vi.mocked(resumeService.refineSection).mockResolvedValue({
      resumeId: RESUME_ID,
      section: 'summary',
      updatedMarkdown: 'Refined content',
      updatedAt: new Date().toISOString(),
    });
    setupMocksWithResume();
    await renderAndWaitForEditor();

    await user.click(screen.getByRole('button', { name: /refine/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Be concise');
    await user.click(within(dialog).getByRole('button', { name: /submit/i }));

    await screen.findByText(/section refined/i, {}, { timeout: 3000 });
  });
});
