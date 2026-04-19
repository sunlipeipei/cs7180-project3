import { describe, it, expect } from 'vitest';
import { renderResumeToPdf } from '../render';
import { resumesFixture } from '../../fixtures/index';

describe('renderResumeToPdf', () => {
  it('returns a Uint8Array starting with %PDF-', async () => {
    const bytes = await renderResumeToPdf(resumesFixture[0]);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(1024);

    const head = Buffer.from(bytes.slice(0, 5)).toString('ascii');
    expect(head).toBe('%PDF-');
  });

  it('renders a larger buffer for a longer resume', async () => {
    const small = await renderResumeToPdf({
      ...resumesFixture[0],
      summary: '## Summary\nOne line.',
      skills: '## Skills\nTS.',
      experience: '## Experience\n- one',
      education: '## Education\n- one',
      projects: '## Projects\n- one',
    });
    const big = await renderResumeToPdf(resumesFixture[0]);
    expect(big.byteLength).toBeGreaterThan(small.byteLength);
  });

  it('handles empty string sections gracefully (no throw)', async () => {
    const bytes = await renderResumeToPdf({
      ...resumesFixture[0],
      projects: '',
    });
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
