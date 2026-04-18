'use client';

// Phase 1.C wires textarea edits → saveResume(). Currently local state only.

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import type { TailoredResume, ResumeSection } from '@/ai/schemas';
import { ResumeSectionEnum } from '@/ai/schemas';
import { getResume, refineSection } from '@/services/resume.service';
import { getJobDescription } from '@/services/jobDescription.service';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog';

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionMap = Record<ResumeSection, string>;

type Status = { message: string; key: number } | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTIONS = ResumeSectionEnum.options as ResumeSection[];
const TRANSIENT_DELAY = 2000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function resumeToSectionMap(resume: TailoredResume): SectionMap {
  return {
    header: resume.header,
    summary: resume.summary,
    skills: resume.skills,
    experience: resume.experience,
    education: resume.education,
    projects: resume.projects,
  };
}

function buildPreview(sections: SectionMap): string {
  return SECTIONS.map((s) => sections[s]).join('\n\n');
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ resumeId: string }>;
}

export default function TailorPage({ params }: PageProps) {
  // Resolve params promise via useEffect to stay Suspense-free in tests.
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resume, setResume] = useState<TailoredResume | null | 'loading'>('loading');
  const [sections, setSections] = useState<SectionMap | null>(null);
  const [jobTitle, setJobTitle] = useState<string>('');
  const [status, setStatus] = useState<Status>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineSection_, setRefineSection_] = useState<ResumeSection>('summary');
  const [refineInstruction, setRefineInstruction] = useState('');

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Resolve params promise ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    params.then(({ resumeId: id }) => {
      if (!cancelled) setResumeId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  // ── Load resume ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!resumeId) return;
    let cancelled = false;
    getResume(resumeId).then((r) => {
      if (cancelled) return;
      setResume(r);
      if (r) {
        setSections(resumeToSectionMap(r));
        getJobDescription(r.jobDescriptionId).then((jd) => {
          if (cancelled) return;
          if (jd) setJobTitle(jd.title);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  // ── Transient status helper ────────────────────────────────────────────────

  function showStatus(message: string) {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatus({ message, key: Date.now() });
    statusTimerRef.current = setTimeout(() => setStatus(null), TRANSIENT_DELAY);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handlePdfRender() {
    console.info('[B2] PDF render requested', { resumeId: resumeId ?? '' });
    showStatus('PDF render requested');
  }

  async function handleRefineSubmit() {
    if (!refineInstruction.trim() || !resumeId) return;
    try {
      const response = await refineSection({
        resumeId,
        section: refineSection_,
        instruction: refineInstruction,
      });
      setSections((prev) =>
        prev ? { ...prev, [response.section]: response.updatedMarkdown } : prev
      );
      setRefineOpen(false);
      setRefineInstruction('');
      showStatus('Section refined');
    } catch {
      // Error handling — Phase 1 will add proper error UI
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (resume === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '60vh',
          color: 'var(--color-on-surface-variant)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <p>Loading resume…</p>
      </div>
    );
  }

  if (resume === null) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '60vh',
          gap: '1rem',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-on-surface-variant)',
        }}
      >
        <p style={{ fontSize: '1.125rem', color: 'var(--color-on-surface)' }}>Resume not found</p>
        <Link
          href="/dashboard"
          style={{
            color: 'var(--color-secondary)',
            fontSize: '0.875rem',
            textDecoration: 'underline',
          }}
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!sections) return null;

  // ── Main editor ────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--color-surface-container-low)',
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'var(--color-on-surface)',
              letterSpacing: '-0.01em',
            }}
          >
            {jobTitle ? `Resume for ${jobTitle}` : `Resume ${resumeId}`}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Transient status */}
          {status && (
            <span
              key={status.key}
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-secondary)',
                fontFamily: 'var(--font-label)',
              }}
            >
              {status.message}
            </span>
          )}

          {/* PDF Render button */}
          <button
            onClick={handlePdfRender}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--color-surface-container-high)',
              color: 'var(--color-on-surface)',
              fontFamily: 'var(--font-headline)',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Render PDF
          </button>

          {/* Refine button (Dialog trigger) */}
          <Dialog open={refineOpen} onOpenChange={setRefineOpen}>
            <DialogTrigger asChild>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--color-secondary)',
                  color: 'var(--color-on-secondary)',
                  fontFamily: 'var(--font-headline)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Refine
              </button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refine Section</DialogTitle>
              </DialogHeader>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Section select */}
                <div>
                  <label
                    htmlFor="refine-section"
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-label)',
                      color: 'var(--color-on-surface-variant)',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Section
                  </label>
                  <select
                    id="refine-section"
                    value={refineSection_}
                    onChange={(e) => setRefineSection_(e.target.value as ResumeSection)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--color-surface-container)',
                      color: 'var(--color-on-surface)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instruction textarea */}
                <div>
                  <label
                    htmlFor="refine-instruction"
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-label)',
                      color: 'var(--color-on-surface-variant)',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Instruction
                  </label>
                  <textarea
                    id="refine-instruction"
                    rows={4}
                    placeholder="e.g. Make it more concise"
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--color-surface-container)',
                      color: 'var(--color-on-surface)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <button
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-xl)',
                      backgroundColor: 'var(--color-surface-container-high)',
                      color: 'var(--color-on-surface-variant)',
                      fontFamily: 'var(--font-headline)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  onClick={handleRefineSubmit}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-on-secondary)',
                    fontFamily: 'var(--font-headline)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Submit
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* ── Two-pane body ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* ── Left pane: section editors ─────────────────────────────────────── */}
        <section
          aria-label="Section editors"
          style={{
            width: '55%',
            overflowY: 'auto',
            padding: '1.5rem',
            backgroundColor: 'var(--color-surface-container-lowest)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {SECTIONS.map((sectionKey) => (
            <div key={sectionKey}>
              <label
                htmlFor={`section-${sectionKey}`}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-headline)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-on-surface-variant)',
                  marginBottom: '0.5rem',
                }}
              >
                {sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}
              </label>
              <textarea
                id={`section-${sectionKey}`}
                rows={6}
                value={sections[sectionKey]}
                onChange={(e) =>
                  setSections((prev) => (prev ? { ...prev, [sectionKey]: e.target.value } : prev))
                }
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-surface-container)',
                  color: 'var(--color-on-surface)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </section>

        {/* ── Right pane: preview ────────────────────────────────────────────── */}
        <section
          aria-label="Preview"
          style={{
            width: '45%',
            overflowY: 'auto',
            padding: '1.5rem',
            backgroundColor: 'var(--color-surface-container-low)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 700,
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--color-on-surface-variant)',
              marginBottom: '1rem',
            }}
          >
            Preview
          </h2>
          <pre
            role="document"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              fontSize: '0.75rem',
              lineHeight: '1.7',
              color: 'var(--color-on-surface)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {buildPreview(sections)}
          </pre>
        </section>
      </div>
    </div>
  );
}
