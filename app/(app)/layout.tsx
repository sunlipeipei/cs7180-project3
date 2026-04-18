import { AppShell } from '@/components/layout/AppShell';

/** Route group layout — applies AppShell (Sidebar + main) to /dashboard, /profile, /tailor. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
