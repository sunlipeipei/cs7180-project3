import { Sidebar } from './Sidebar';

/** Server component that wraps pages with the fixed Sidebar and a main content area. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
