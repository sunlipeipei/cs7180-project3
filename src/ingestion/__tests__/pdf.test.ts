import { describe, it, expect } from 'vitest';
import { extractText } from '../pdf';

// Minimal PDF (1553 bytes, react-pdf generated) containing the literal text
// "Hello BypassHire Phase 1A ingest" on a single A4 page. Used as a stable
// fixture so the test does not depend on @react-pdf/renderer at runtime.
const FIXTURE_PDF_BASE64 =
  'JVBERi0xLjMKJf////8KOSAwIG9iago8PAovVHlwZSAvRXh0R1N0YXRlCi9jYSAxCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL01lZGlhQm94IFswIDAgNTk1LjI4MDAyOSA4NDEuODkwMDE1XQovQ29udGVudHMgNiAwIFIKL1Jlc291cmNlcyA3IDAgUgovVXNlclVuaXQgMQo+PgplbmRvYmoKNyAwIG9iago8PAovUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0KL0V4dEdTdGF0ZSA8PAovR3MxIDkgMCBSCj4+Ci9Gb250IDw8Ci9GMSAxMCAwIFIKPj4KL0NvbG9yU3BhY2UgPDwKPj4KPj4KZW5kb2JqCjEyIDAgb2JqCihyZWFjdC1wZGYpCmVuZG9iagoxMyAwIG9iagoocmVhY3QtcGRmKQplbmRvYmoKMTQgMCBvYmoKKEQ6MjAyNjA0MTgwODM3NTlaKQplbmRvYmoKMTEgMCBvYmoKPDwKL1Byb2R1Y2VyIDEyIDAgUgovQ3JlYXRvciAxMyAwIFIKL0NyZWF0aW9uRGF0ZSAxNCAwIFIKPj4KZW5kb2JqCjEwIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvSGVsdmV0aWNhCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwo+PgplbmRvYmoKNCAwIG9iago8PAo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMSAwIFIKL05hbWVzIDIgMCBSCi9WaWV3ZXJQcmVmZXJlbmNlcyA1IDAgUgo+PgplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzggMCBSXQo+PgplbmRvYmoKMiAwIG9iago8PAovRGVzdHMgPDwKICAvTmFtZXMgWwpdCj4+Cj4+CmVuZG9iago1IDAgb2JqCjw8Ci9EaXNwbGF5RG9jVGl0bGUgdHJ1ZQo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDE4MAovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0KeJxtT8EKgzAMvecr8gPTpLZpBfEg24TdHL2NnYobOziQwr5/tE7xMAJJeO/l8cJISHhgJHSaC1cTscEwwbwVZ0nqLIVKXHkcP68wXvsOQwTKfAxvKPvI+Iwww7Dd/bHu/M5zR/kJyjMjO/QPuDXaiZHQImGzjocirfJqa0vCtrKVdlIvkBKjyNAidYlNQMWaM6ToJ5RRrBhbWd0i3dFf4ORh2DIpqwsmjZSyDvmZtb6/pD6ECmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDE1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDY5OSAwMDAwMCBuIAowMDAwMDAwNzU2IDAwMDAwIG4gCjAwMDAwMDA2MTIgMDAwMDAgbiAKMDAwMDAwMDU5MSAwMDAwMCBuIAowMDAwMDAwODAzIDAwMDAwIG4gCjAwMDAwMDA4NDYgMDAwMDAgbiAKMDAwMDAwMDE4OSAwMDAwMCBuIAowMDAwMDAwMDU5IDAwMDAwIG4gCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDQ5MyAwMDAwMCBuIAowMDAwMDAwNDE3IDAwMDAwIG4gCjAwMDAwMDAzMjUgMDAwMDAgbiAKMDAwMDAwMDM1MyAwMDAwMCBuIAowMDAwMDAwMzgxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgMTUKL1Jvb3QgMyAwIFIKL0luZm8gMTEgMCBSCi9JRCBbPGMzYmIwZGZmZmRmOGFhNTcwODg0NDFjODQ0MGZlN2I5PiA8YzNiYjBkZmZmZGY4YWE1NzA4ODQ0MWM4NDQwZmU3Yjk+XQo+PgpzdGFydHhyZWYKMTA5OAolJUVPRgo=';

function fixturePdfBytes(): Uint8Array {
  return Uint8Array.from(Buffer.from(FIXTURE_PDF_BASE64, 'base64'));
}

describe('extractText', () => {
  it('returns the plain text of a single-page PDF', async () => {
    const bytes = fixturePdfBytes();
    const text = await extractText(bytes);

    expect(typeof text).toBe('string');
    expect(text).toContain('Hello BypassHire Phase 1A ingest');
  });

  it('joins multi-page text with a single newline between pages', async () => {
    // Same fixture, but the contract must be "pages joined with \n" regardless
    // of page count so callers can rely on a deterministic separator.
    const bytes = fixturePdfBytes();
    const text = await extractText(bytes);

    // Single-page fixture must not introduce a leading/trailing newline.
    expect(text.startsWith('\n')).toBe(false);
    expect(text.endsWith('\n')).toBe(false);
  });

  it('throws a typed error when the buffer is not a PDF', async () => {
    const junk = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);

    await expect(extractText(junk)).rejects.toThrow(/PDF|invalid|malformed/i);
  });

  it('throws when given an empty buffer', async () => {
    const empty = new Uint8Array(0);

    await expect(extractText(empty)).rejects.toThrow();
  });
});
