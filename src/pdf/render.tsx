import { renderToBuffer } from '@react-pdf/renderer';
import { ResumeTemplate } from './ResumeTemplate';
import type { TailoredResume } from '../ai/schemas';

/**
 * Server-side render a TailoredResume into PDF bytes. Intended to be
 * called from a route handler that streams the result; we return a
 * Uint8Array so the caller can wrap it in a Response without Buffer-
 * specific APIs leaking into the edge runtime later.
 */
export async function renderResumeToPdf(resume: TailoredResume): Promise<Uint8Array> {
  const buf = await renderToBuffer(<ResumeTemplate resume={resume} />);
  return new Uint8Array(buf);
}
