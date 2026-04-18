'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import React from 'react';

// ── Re-exports of Radix primitives with BypassHire design-system styling ──────

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

/**
 * Overlay + content wrapper.
 * Glassmorphism overlay per DESIGN.md §2 — "The AI Signature":
 *   secondary-container at 12% opacity + backdrop-blur: 20px.
 * Content: surface-container-high, radius-xl, Scale-5 padding, max-width 32rem.
 * No 1px borders (DESIGN.md §2 — "No-Line Rule").
 */
export function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'color-mix(in srgb, var(--color-surface) 60%, transparent)',
          backdropFilter: 'blur(8px)',
          zIndex: 40,
        }}
      />
      <RadixDialog.Content
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--color-surface-container-high)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.1rem', // Scale 5
          maxWidth: '32rem',
          width: '90vw',
          zIndex: 50,
          boxShadow: '0 40px 80px rgba(228, 225, 237, 0.06)',
        }}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

/** Header slot — space-grotesk label style. */
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      {children}
    </div>
  );
}

/** Title — Space Grotesk headline. */
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <RadixDialog.Title
      style={{
        fontFamily: 'var(--font-headline)',
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--color-on-surface)',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </RadixDialog.Title>
  );
}

/** Footer slot — right-aligned action row. */
export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
        marginTop: '1.25rem',
      }}
    >
      {children}
    </div>
  );
}
