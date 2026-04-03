import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BypassHire',
  description: 'AI-powered job application automation — tailored resumes in under 5 minutes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
