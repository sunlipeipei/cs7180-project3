import { extractText as unpdfExtractText } from 'unpdf';

/**
 * Extract plain text from a PDF byte buffer using unpdf. Pages are joined
 * with a single newline, no leading or trailing newline. Throws a typed
 * error on malformed, empty, or non-PDF input so callers can surface 400s
 * instead of leaking the underlying parser's stack.
 */
export async function extractText(bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength === 0) {
    throw new Error('Invalid PDF: empty buffer');
  }

  let result: { text: string[] };
  try {
    result = await unpdfExtractText(bytes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid PDF: ${message}`);
  }

  return result.text.join('\n');
}
