'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const NAV_ITEMS: { label: string; href: '/dashboard' | '/profile' }[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profile', href: '/profile' },
];

/** Fixed 240px sidebar with logo, nav links, and Clerk UserButton. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--color-surface-container-low)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.1rem',
      }}
    >
      {/* Wordmark */}
      <div style={{ marginBottom: '2rem', padding: '0.25rem 0.5rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-on-surface)',
            letterSpacing: '-0.01em',
          }}
        >
          BypassHire
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                fontFamily: 'var(--font-headline)',
                textDecoration: 'none',
                transition: 'background-color 0.15s',
                backgroundColor: isActive ? 'var(--color-surface-container-high)' : 'transparent',
                color: isActive
                  ? 'var(--color-on-surface)'
                  : 'var(--color-on-surface-variant)',
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{ paddingTop: '1rem' }}>
        <UserButton />
      </div>
    </aside>
  );
}
