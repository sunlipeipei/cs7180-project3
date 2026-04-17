import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Must mock dns BEFORE importing safeFetch
vi.mock('node:dns', () => ({
  promises: {
    lookup: vi.fn(),
  },
}));

import * as dns from 'node:dns';
import { safeFetch } from '../safeFetch';

const mockLookup = dns.promises.lookup as ReturnType<typeof vi.fn>;

// Helper: make lookup return a set of address records
function stubDns(addresses: Array<{ address: string; family: 4 | 6 }>) {
  mockLookup.mockResolvedValue(addresses);
}

// Helper: stub global fetch
function stubFetch(
  responses: Array<{
    status: number;
    headers?: Record<string, string>;
    body?: string;
    ok?: boolean;
  }>
) {
  let callIndex = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn((_url: string, _opts?: RequestInit) => {
      const r = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      const headers = new Headers(r.headers ?? {});
      return Promise.resolve({
        status: r.status,
        ok: r.ok ?? (r.status >= 200 && r.status < 300),
        headers,
        url: _url,
        body: r.body != null ? makeReadableStream(r.body) : null,
      } as unknown as Response);
    })
  );
}

function makeReadableStream(content: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

function makeLargeStream(sizeBytes: number): ReadableStream<Uint8Array> {
  const chunkSize = 65536; // 64KB chunks
  let sent = 0;
  return new ReadableStream({
    pull(controller) {
      if (sent >= sizeBytes) {
        controller.close();
        return;
      }
      const remaining = sizeBytes - sent;
      const size = Math.min(chunkSize, remaining);
      controller.enqueue(new Uint8Array(size));
      sent += size;
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: restore a real-looking fetch stub that does nothing harmful
  stubDns([{ address: '93.184.216.34', family: 4 }]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Scheme checks
// ---------------------------------------------------------------------------
describe('safeFetch — scheme validation', () => {
  it('rejects ftp:// scheme', async () => {
    await expect(safeFetch('ftp://example.com/file')).rejects.toThrow(/scheme/i);
  });

  it('rejects file:// scheme', async () => {
    await expect(safeFetch('file:///etc/passwd')).rejects.toThrow(/scheme/i);
  });

  it('rejects javascript: scheme', async () => {
    await expect(safeFetch('javascript:alert(1)')).rejects.toThrow(/scheme/i);
  });

  it('rejects data: scheme', async () => {
    await expect(safeFetch('data:text/plain,hello')).rejects.toThrow(/scheme/i);
  });
});

// ---------------------------------------------------------------------------
// DNS / private IP checks
// ---------------------------------------------------------------------------
describe('safeFetch — DNS SSRF blocklist (IPv4)', () => {
  it('rejects loopback 127.0.0.1', async () => {
    stubDns([{ address: '127.0.0.1', family: 4 }]);
    await expect(safeFetch('http://internal.example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects private 10.0.0.1', async () => {
    stubDns([{ address: '10.0.0.1', family: 4 }]);
    await expect(safeFetch('http://internal.example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects AWS metadata endpoint 169.254.169.254', async () => {
    stubDns([{ address: '169.254.169.254', family: 4 }]);
    await expect(safeFetch('http://metadata.internal/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects 192.168.1.1', async () => {
    stubDns([{ address: '192.168.1.1', family: 4 }]);
    await expect(safeFetch('http://router.local/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects 172.16.0.1 (172.16.0.0/12 range)', async () => {
    stubDns([{ address: '172.16.0.1', family: 4 }]);
    await expect(safeFetch('http://internal.example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects 172.31.255.255 (still in 172.16.0.0/12)', async () => {
    stubDns([{ address: '172.31.255.255', family: 4 }]);
    await expect(safeFetch('http://internal.example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('allows 172.32.0.0 (just outside 172.16.0.0/12)', async () => {
    stubDns([{ address: '172.32.0.0', family: 4 }]);
    stubFetch([{ status: 200, body: 'hello' }]);
    const result = await safeFetch('http://example.com/');
    expect(result.body).toBe('hello');
  });

  it('rejects 100.64.0.1 (CGNAT 100.64.0.0/10)', async () => {
    stubDns([{ address: '100.64.0.1', family: 4 }]);
    await expect(safeFetch('http://internal.example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects 0.0.0.1 (0.0.0.0/8)', async () => {
    stubDns([{ address: '0.0.0.1', family: 4 }]);
    await expect(safeFetch('http://weird.example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects when ANY resolved address is private (mixed public+private)', async () => {
    stubDns([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ]);
    await expect(safeFetch('http://example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });
});

describe('safeFetch — DNS SSRF blocklist (IPv6)', () => {
  it('rejects loopback ::1', async () => {
    stubDns([{ address: '::1', family: 6 }]);
    await expect(safeFetch('http://localhost6.example.com/')).rejects.toThrow(
      /private|blocked|SSRF/i
    );
  });

  it('rejects ULA fc00::1 (fc00::/7)', async () => {
    stubDns([{ address: 'fc00::1', family: 6 }]);
    await expect(safeFetch('http://ula.example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects ULA fd12:3456::1 (fc00::/7)', async () => {
    stubDns([{ address: 'fd12:3456::1', family: 6 }]);
    await expect(safeFetch('http://ula2.example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects link-local fe80::1 (fe80::/10)', async () => {
    stubDns([{ address: 'fe80::1', family: 6 }]);
    await expect(safeFetch('http://linklocal.example.com/')).rejects.toThrow(
      /private|blocked|SSRF/i
    );
  });

  it('rejects IPv4-mapped ::ffff:192.168.1.1', async () => {
    stubDns([{ address: '::ffff:192.168.1.1', family: 6 }]);
    await expect(safeFetch('http://mapped.example.com/')).rejects.toThrow(
      /private|blocked|SSRF/i
    );
  });

  it('rejects IPv4-mapped ::ffff:127.0.0.1', async () => {
    stubDns([{ address: '::ffff:127.0.0.1', family: 6 }]);
    await expect(safeFetch('http://mapped2.example.com/')).rejects.toThrow(
      /private|blocked|SSRF/i
    );
  });
});

// ---------------------------------------------------------------------------
// Happy path: public IP
// ---------------------------------------------------------------------------
describe('safeFetch — happy path', () => {
  it('resolves for a public IP (93.184.216.34 — example.com)', async () => {
    stubDns([{ address: '93.184.216.34', family: 4 }]);
    stubFetch([{ status: 200, body: 'Job description content here' }]);

    const result = await safeFetch('https://example.com/jobs/1');
    expect(result.body).toBe('Job description content here');
    expect(result.finalUrl).toBe('https://example.com/jobs/1');
  });

  it('returns the final URL equal to input when no redirect', async () => {
    stubDns([{ address: '93.184.216.34', family: 4 }]);
    stubFetch([{ status: 200, body: 'content' }]);
    const result = await safeFetch('https://example.com/');
    expect(result.finalUrl).toBe('https://example.com/');
  });
});

// ---------------------------------------------------------------------------
// Timeout
// ---------------------------------------------------------------------------
describe('safeFetch — timeout', () => {
  it('throws when fetch does not resolve within timeoutMs', async () => {
    stubDns([{ address: '93.184.216.34', family: 4 }]);
    // fetch hangs forever (only resolves after test ends)
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            // Never resolves during the test
            setTimeout(() => {
              resolve({
                status: 200,
                ok: true,
                headers: new Headers(),
                body: makeReadableStream('late'),
              } as unknown as Response);
            }, 60_000);
          })
      )
    );

    await expect(safeFetch('https://example.com/', { timeoutMs: 50 })).rejects.toThrow(
      /timeout|abort/i
    );
  }, 3000);
});

// ---------------------------------------------------------------------------
// Size cap
// ---------------------------------------------------------------------------
describe('safeFetch — size cap', () => {
  it('throws when response body exceeds maxBytes', async () => {
    stubDns([{ address: '93.184.216.34', family: 4 }]);

    const sixMB = 6 * 1024 * 1024;
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers(),
          url: 'https://example.com/',
          body: makeLargeStream(sixMB),
        } as unknown as Response)
      )
    );

    await expect(
      safeFetch('https://example.com/', { maxBytes: 1024 })
    ).rejects.toThrow(/size|too large|exceeded/i);
  });

  it('accepts response right at the maxBytes boundary', async () => {
    stubDns([{ address: '93.184.216.34', family: 4 }]);

    const content = 'x'.repeat(100);
    stubFetch([{ status: 200, body: content }]);

    const result = await safeFetch('https://example.com/', { maxBytes: 100 });
    expect(result.body.length).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Redirect handling
// ---------------------------------------------------------------------------
describe('safeFetch — redirect handling', () => {
  it('follows a redirect to a public host and returns final body', async () => {
    // First call resolves to public IP → returns 301
    // Second call resolves to public IP → returns 200
    let callCount = 0;
    mockLookup.mockImplementation(() => {
      return Promise.resolve([{ address: '93.184.216.34', family: 4 }]);
    });

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            status: 301,
            ok: false,
            headers: new Headers({ location: 'https://example.com/final' }),
            url: _url,
            body: makeReadableStream(''),
          } as unknown as Response);
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers({}),
          url: _url,
          body: makeReadableStream('final content'),
        } as unknown as Response);
      })
    );

    const result = await safeFetch('https://example.com/redirect');
    expect(result.body).toBe('final content');
    expect(result.finalUrl).toBe('https://example.com/final');
  });

  it('rejects redirect to a private IP (SSRF via redirect)', async () => {
    let callCount = 0;
    mockLookup.mockImplementation((_hostname: string) => {
      callCount++;
      // First DNS lookup (original host) returns public IP
      if (callCount === 1) {
        return Promise.resolve([{ address: '93.184.216.34', family: 4 }]);
      }
      // Second DNS lookup (redirect target) returns loopback
      return Promise.resolve([{ address: '127.0.0.1', family: 4 }]);
    });

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string) =>
        Promise.resolve({
          status: 301,
          ok: false,
          headers: new Headers({ location: 'http://internal.corp/' }),
          url: _url,
          body: makeReadableStream(''),
        } as unknown as Response)
      )
    );

    await expect(safeFetch('https://example.com/')).rejects.toThrow(/private|blocked|SSRF/i);
  });

  it('rejects redirect chain that exceeds maxRedirects', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string) =>
        Promise.resolve({
          status: 301,
          ok: false,
          headers: new Headers({ location: 'https://example.com/loop' }),
          url: _url,
          body: makeReadableStream(''),
        } as unknown as Response)
      )
    );

    await expect(
      safeFetch('https://example.com/', { maxRedirects: 2 })
    ).rejects.toThrow(/redirect/i);
  });

  it('rejects a relative Location header', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string) =>
        Promise.resolve({
          status: 301,
          ok: false,
          headers: new Headers({ location: '/relative/path' }),
          url: _url,
          body: makeReadableStream(''),
        } as unknown as Response)
      )
    );

    await expect(safeFetch('https://example.com/')).rejects.toThrow(
      /redirect|absolute|scheme/i
    );
  });

  it('rejects redirect to non-http scheme', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string) =>
        Promise.resolve({
          status: 301,
          ok: false,
          headers: new Headers({ location: 'ftp://example.com/file' }),
          url: _url,
          body: makeReadableStream(''),
        } as unknown as Response)
      )
    );

    await expect(safeFetch('https://example.com/')).rejects.toThrow(/scheme/i);
  });
});
