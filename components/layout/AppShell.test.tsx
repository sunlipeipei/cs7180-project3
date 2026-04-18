/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}));

import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders children inside a main element alongside the Sidebar', () => {
    render(
      <AppShell>
        <p data-testid="child-content">Hello world</p>
      </AppShell>
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    // Sidebar wordmark should also be present
    expect(screen.getByText('BypassHire')).toBeInTheDocument();
  });
});
