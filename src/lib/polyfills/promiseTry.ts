// Promise.try polyfill — self-executing at import time.
//
// unpdf's bundled pdfjs uses Promise.try, which first shipped natively in
// Node 24 / V8 13. GitHub Actions (Node 22.22.x) and Vercel's default
// Node 22 runtime both lack it. Polyfilling is safer than pinning runtime
// versions up the stack.
//
// Import this module before anything that may reach unpdf. For ingest
// routes that means at the very top of src/ingestion/pdf.ts; for tests
// the vitest setup file does it once for all suites.

// TS lib already declares Promise.try in lib.esnext; we just need to make
// sure the runtime has it on Node 22 (GitHub Actions + Vercel default).
if (typeof (Promise as unknown as { try?: unknown }).try !== 'function') {
  Object.defineProperty(Promise, 'try', {
    configurable: true,
    writable: true,
    value: function promiseTry<T>(
      fn: (...args: unknown[]) => T | PromiseLike<T>,
      ...args: unknown[]
    ): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        try {
          resolve(fn(...args));
        } catch (err) {
          reject(err);
        }
      });
    },
  });
}

export {};
