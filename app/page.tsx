import Link from 'next/link';

const FEATURES = [
  {
    label: 'Resume Tailoring',
    description: 'Claude reads the JD and rewrites your resume to match — in under 60 seconds.',
  },
  {
    label: 'Interactive Editing',
    description:
      'Comment on any section, accept or reject AI suggestions, keep full version history.',
  },
  {
    label: 'Auto-Fill Forms',
    description: 'One-click population of Workday and Greenhouse fields. You review before submit.',
  },
];

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-on-background)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Top nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          height: '3.5rem',
          backgroundColor: 'var(--color-surface-container-low)',
          borderBottom: '1px solid var(--color-outline-variant)',
        }}
      >
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

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a
            href="/sign-in"
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-on-surface-variant)',
              textDecoration: 'none',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-xl)',
              transition: 'color 0.15s',
            }}
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-on-secondary)',
              backgroundColor: 'var(--color-secondary)',
              textDecoration: 'none',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-xl)',
              fontFamily: 'var(--font-label)',
            }}
          >
            Get Started
          </a>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: '7rem 2rem 5rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-secondary)',
            fontFamily: 'var(--font-label)',
            marginBottom: '1.25rem',
          }}
        >
          AI-Powered Job Applications
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 700,
            color: 'var(--color-on-surface)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            margin: '0 0 1.5rem',
          }}
        >
          From job post to tailored
          <br />
          <span style={{ color: 'var(--color-secondary)' }}>resume in 5 minutes.</span>
        </h1>

        <p
          style={{
            fontSize: '1.0625rem',
            color: 'var(--color-on-surface-variant)',
            lineHeight: 1.7,
            maxWidth: '36rem',
            margin: '0 auto 2.5rem',
          }}
        >
          BypassHire tailors your resume to each job description, lets you edit with AI assistance,
          and auto-fills application forms — so you apply faster without sacrificing quality.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/sign-up"
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-on-secondary)',
              fontFamily: 'var(--font-label)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius-xl)',
              textDecoration: 'none',
            }}
          >
            Start for free →
          </a>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--color-surface-container-high)',
              color: 'var(--color-on-surface)',
              fontFamily: 'var(--font-label)',
              fontWeight: 500,
              fontSize: '0.9375rem',
              padding: '0.75rem 2rem',
              borderRadius: 'var(--radius-xl)',
              textDecoration: 'none',
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--color-outline-variant)',
          opacity: 0.5,
        }}
      />

      {/* Features */}
      <section
        style={{
          maxWidth: '56rem',
          margin: '0 auto',
          padding: '5rem 2rem 6rem',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-on-surface-variant)',
            fontFamily: 'var(--font-label)',
            marginBottom: '3rem',
            textAlign: 'center',
          }}
        >
          How it works
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
            gap: '1.5rem',
          }}
        >
          {FEATURES.map(({ label, description }, i) => (
            <div
              key={label}
              style={{
                backgroundColor: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.75rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-secondary)',
                  fontFamily: 'var(--font-label)',
                  marginBottom: '0.75rem',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3
                style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  marginBottom: '0.625rem',
                }}
              >
                {label}
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-on-surface-variant)',
                  lineHeight: 1.65,
                }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--color-outline-variant)',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--color-on-surface-variant)',
          opacity: 0.6,
        }}
      >
        © {new Date().getFullYear()} BypassHire — built with Claude
      </footer>
    </div>
  );
}
