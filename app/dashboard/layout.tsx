import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-on-background)' }}
    >
      {/* Sidebar */}
      <aside
        className="flex w-16 flex-col items-center justify-between py-6"
        style={{ backgroundColor: 'var(--color-surface-container-low)' }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo mark */}
          <div
            className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
            style={{
              backgroundColor: 'var(--color-primary-container)',
              color: 'var(--color-secondary)',
              fontFamily: 'var(--font-headline)',
            }}
          >
            B
          </div>

          <Link
            href="/dashboard"
            title="Dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[var(--color-surface-container-high)]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </Link>

          <Link
            href="/dashboard/new"
            title="New Resume"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[var(--color-surface-container-high)]"
            style={{ color: 'var(--color-secondary)' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4">
          <UserButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
