/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Must be hoisted before importing the component
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when current path is /profile', () => {
    beforeEach(() => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/profile');
    });

    it('renders the BypassHire wordmark', () => {
      render(<Sidebar />);
      expect(screen.getByText('BypassHire')).toBeInTheDocument();
    });

    it('renders Dashboard nav link with correct href', () => {
      render(<Sidebar />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders Profile nav link with correct href', () => {
      render(<Sidebar />);
      const profileLink = screen.getByRole('link', { name: /profile/i });
      expect(profileLink).toHaveAttribute('href', '/profile');
    });

    it('marks the /profile link as active via aria-current="page"', () => {
      render(<Sidebar />);
      const profileLink = screen.getByRole('link', { name: /profile/i });
      expect(profileLink).toHaveAttribute('aria-current', 'page');
    });

    it('does NOT mark the /dashboard link as active', () => {
      render(<Sidebar />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).not.toHaveAttribute('aria-current', 'page');
    });

    it('renders the Clerk UserButton', () => {
      render(<Sidebar />);
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
    });
  });

  describe('when current path is /dashboard', () => {
    beforeEach(() => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/dashboard');
    });

    it('marks the /dashboard link as active via aria-current="page"', () => {
      render(<Sidebar />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('does NOT mark the /profile link as active', () => {
      render(<Sidebar />);
      const profileLink = screen.getByRole('link', { name: /profile/i });
      expect(profileLink).not.toHaveAttribute('aria-current', 'page');
    });
  });
});
