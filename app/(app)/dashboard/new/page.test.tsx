/**
 * @vitest-environment jsdom
 *
 * Tests for /dashboard/new (NewProjectPage)
 *
 * Strategy:
 * - Mock createJD from jobDescription.service so no real latency/network.
 * - Mock next/navigation's useRouter so we can spy on router.push.
 * - Render with RTL in jsdom environment (registered in vitest.config.ts under app-components project).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks (must be hoisted before any real imports of the modules) ──────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockCreateJD = vi.fn();

vi.mock('@/services/jobDescription.service', () => ({
  createJD: (...args: unknown[]) => mockCreateJD(...args),
}));

// ── Component under test ────────────────────────────────────────────────────

import NewProjectPage from './page';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeJDResponse(overrides = {}) {
  return {
    jobDescriptionId: 'test-uuid-1234',
    title: 'Senior Engineer',
    company: 'Unknown',
    parsedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('NewProjectPage — /dashboard/new', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Rendering ────────────────────────────────────────────────────────

  it('renders the page heading', () => {
    render(<NewProjectPage />);
    expect(screen.getByRole('heading', { name: /new project setup/i })).toBeTruthy();
  });

  it('renders the source mode toggle with "Paste Text" and "Enter URL" options', () => {
    render(<NewProjectPage />);
    expect(screen.getByRole('button', { name: /paste text/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /enter url/i })).toBeTruthy();
  });

  it('renders the submit button', () => {
    render(<NewProjectPage />);
    expect(screen.getByRole('button', { name: /start tailoring/i })).toBeTruthy();
  });

  it('defaults to "Paste Text" mode and shows a textarea', () => {
    render(<NewProjectPage />);
    expect(screen.getByPlaceholderText(/paste the full job description/i)).toBeTruthy();
  });

  it('switching to "Enter URL" mode shows a url input instead of textarea', async () => {
    const user = userEvent.setup();
    render(<NewProjectPage />);

    await user.click(screen.getByRole('button', { name: /enter url/i }));

    expect(screen.getByPlaceholderText(/https:\/\/jobs/i)).toBeTruthy();
    expect(screen.queryByPlaceholderText(/paste the full job description/i)).toBeNull();
  });

  // ── 2. Validation ───────────────────────────────────────────────────────

  it('submit button is disabled when the content field is empty', () => {
    render(<NewProjectPage />);
    const btn = screen.getByRole('button', { name: /start tailoring/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('does NOT call createJD and does NOT navigate when submitted with empty content', async () => {
    const user = userEvent.setup();
    render(<NewProjectPage />);

    const form = screen.getByRole('button', { name: /start tailoring/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCreateJD).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ── 3. Happy path (paste mode) ──────────────────────────────────────────

  it('calls createJD with { source: "paste", content } when in paste mode and submits', async () => {
    mockCreateJD.mockResolvedValueOnce(makeJDResponse());
    const user = userEvent.setup();
    render(<NewProjectPage />);

    const textarea = screen.getByPlaceholderText(/paste the full job description/i);
    await user.type(textarea, 'We are looking for a senior engineer');

    await user.click(screen.getByRole('button', { name: /start tailoring/i }));

    await waitFor(() => {
      expect(mockCreateJD).toHaveBeenCalledTimes(1);
      expect(mockCreateJD).toHaveBeenCalledWith({
        source: 'paste',
        content: 'We are looking for a senior engineer',
      });
    });
  });

  it('calls createJD with { source: "url", content } when in url mode and submits', async () => {
    mockCreateJD.mockResolvedValueOnce(makeJDResponse());
    const user = userEvent.setup();
    render(<NewProjectPage />);

    await user.click(screen.getByRole('button', { name: /enter url/i }));

    const urlInput = screen.getByPlaceholderText(/https:\/\/jobs/i);
    await user.type(urlInput, 'https://jobs.example.com/senior-engineer');

    await user.click(screen.getByRole('button', { name: /start tailoring/i }));

    await waitFor(() => {
      expect(mockCreateJD).toHaveBeenCalledTimes(1);
      expect(mockCreateJD).toHaveBeenCalledWith({
        source: 'url',
        content: 'https://jobs.example.com/senior-engineer',
      });
    });
  });

  // ── 4. Navigation on success ────────────────────────────────────────────

  it('navigates to /dashboard after successful createJD call', async () => {
    mockCreateJD.mockResolvedValueOnce(makeJDResponse());
    const user = userEvent.setup();
    render(<NewProjectPage />);

    const textarea = screen.getByPlaceholderText(/paste the full job description/i);
    await user.type(textarea, 'Job description content here');

    await user.click(screen.getByRole('button', { name: /start tailoring/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ── 5. Loading state ────────────────────────────────────────────────────

  it('shows a loading indicator while createJD is in flight', async () => {
    let resolve!: (v: ReturnType<typeof makeJDResponse>) => void;
    mockCreateJD.mockReturnValueOnce(
      new Promise<ReturnType<typeof makeJDResponse>>((res) => {
        resolve = res;
      })
    );

    const user = userEvent.setup();
    render(<NewProjectPage />);

    const textarea = screen.getByPlaceholderText(/paste the full job description/i);
    await user.type(textarea, 'Some job description text');
    await user.click(screen.getByRole('button', { name: /start tailoring/i }));

    // While in-flight, button text changes to loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyz/i })).toBeTruthy();
    });

    // Resolve and confirm loading state clears
    resolve(makeJDResponse());
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start tailoring/i })).toBeTruthy();
    });
  });

  it('submit button is disabled while loading', async () => {
    let resolve!: (v: ReturnType<typeof makeJDResponse>) => void;
    mockCreateJD.mockReturnValueOnce(
      new Promise<ReturnType<typeof makeJDResponse>>((res) => {
        resolve = res;
      })
    );

    const user = userEvent.setup();
    render(<NewProjectPage />);

    const textarea = screen.getByPlaceholderText(/paste the full job description/i);
    await user.type(textarea, 'Some job description text');
    await user.click(screen.getByRole('button', { name: /start tailoring/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /analyz/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    resolve(makeJDResponse());
  });

  // ── 6. Error handling ───────────────────────────────────────────────────

  it('shows an inline error message when createJD rejects', async () => {
    mockCreateJD.mockRejectedValueOnce(new Error('Network failure'));
    const user = userEvent.setup();
    render(<NewProjectPage />);

    const textarea = screen.getByPlaceholderText(/paste the full job description/i);
    await user.type(textarea, 'Some job description text');
    await user.click(screen.getByRole('button', { name: /start tailoring/i }));

    await waitFor(() => {
      expect(screen.getByText(/network failure/i)).toBeTruthy();
    });

    // Router should NOT have been called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('clears the error when the user switches modes', async () => {
    mockCreateJD.mockRejectedValueOnce(new Error('Some error'));
    const user = userEvent.setup();
    render(<NewProjectPage />);

    const textarea = screen.getByPlaceholderText(/paste the full job description/i);
    await user.type(textarea, 'Some job description text');
    await user.click(screen.getByRole('button', { name: /start tailoring/i }));

    await waitFor(() => {
      expect(screen.getByText(/some error/i)).toBeTruthy();
    });

    // Switch mode — error should clear
    await user.click(screen.getByRole('button', { name: /enter url/i }));

    expect(screen.queryByText(/some error/i)).toBeNull();
  });
});
