import * as dns from 'node:dns';

export interface SafeFetchOptions {
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
}

export interface SafeFetchResult {
  body: string;
  finalUrl: string;
}

// ---------------------------------------------------------------------------
// IP range helpers
// ---------------------------------------------------------------------------

/**
 * Convert dotted-decimal IPv4 string to a 32-bit unsigned integer.
 */
function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Check whether an IPv4 address string falls within a CIDR block.
 * e.g. inCidrV4('10.0.0.1', '10.0.0.0', 8) → true
 */
function inCidrV4(address: string, network: string, prefixLen: number): boolean {
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return (ipv4ToInt(address) & mask) === (ipv4ToInt(network) & mask);
}

const BLOCKED_V4_RANGES: Array<[string, number]> = [
  ['127.0.0.0', 8], // loopback
  ['10.0.0.0', 8], // private class A
  ['172.16.0.0', 12], // private class B
  ['192.168.0.0', 16], // private class C
  ['169.254.0.0', 16], // link-local / AWS metadata
  ['100.64.0.0', 10], // CGNAT
  ['0.0.0.0', 8], // "this" network
];

function isBlockedV4(address: string): boolean {
  return BLOCKED_V4_RANGES.some(([net, prefix]) => inCidrV4(address, net, prefix));
}

/**
 * Parse an IPv4-mapped IPv6 address "::ffff:a.b.c.d" or "::ffff:0xhh0xhh..."
 * Returns the dotted-decimal IPv4 string, or null if not a mapped address.
 */
function extractMappedV4(addr: string): string | null {
  const lower = addr.toLowerCase();
  // Handles both ::ffff:192.168.1.1 and ::ffff:c0a8:0101 forms
  const dottedMatch = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dottedMatch) return dottedMatch[1];

  // Hex form: ::ffff:c0a8:0101 → "192.168.1.1"
  const hexMatch = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMatch) {
    const hi = parseInt(hexMatch[1], 16);
    const lo = parseInt(hexMatch[2], 16);
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
  }
  return null;
}

function isBlockedV6(address: string): boolean {
  const lower = address.toLowerCase();

  // ::1 loopback
  if (lower === '::1') return true;

  // fe80::/10 link-local
  // First 10 bits: 1111 1110 10xx → fe80..febf
  if (/^fe[89ab][0-9a-f]:/i.test(lower) || lower.startsWith('fe80:')) return true;
  // More robust: parse first 16-bit group
  const firstGroup = parseInt(lower.split(':')[0] || '0', 16);
  if ((firstGroup & 0xffc0) === 0xfe80) return true;

  // fc00::/7 ULA — covers fc00:: through fdff::
  // First byte fc or fd
  const firstByte = firstGroup >> 8;
  if (firstByte === 0xfc || firstByte === 0xfd) return true;

  // IPv4-mapped ::ffff:0:0/96
  const mapped = extractMappedV4(lower);
  if (mapped !== null) {
    return isBlockedV4(mapped);
  }

  return false;
}

// ---------------------------------------------------------------------------
// Core validation
// ---------------------------------------------------------------------------

function validateScheme(urlString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL scheme: cannot parse "${urlString}"`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `Invalid URL scheme: only http and https are allowed, got "${parsed.protocol}"`
    );
  }
  return parsed;
}

async function validateDns(hostname: string): Promise<void> {
  let addresses: dns.LookupAddress[];
  try {
    addresses = (await dns.promises.lookup(hostname, { all: true })) as dns.LookupAddress[];
  } catch (err) {
    throw new Error(`DNS lookup failed for "${hostname}": ${(err as Error).message}`);
  }

  for (const { address, family } of addresses) {
    if (family === 4 && isBlockedV4(address)) {
      throw new Error(
        `SSRF blocked: "${hostname}" resolves to private/blocked IPv4 address ${address}`
      );
    }
    if (family === 6 && isBlockedV6(address)) {
      throw new Error(
        `SSRF blocked: "${hostname}" resolves to private/blocked IPv6 address ${address}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Main safeFetch
// ---------------------------------------------------------------------------

export async function safeFetch(
  url: string,
  opts: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024;
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const maxRedirects = opts.maxRedirects ?? 3;

  // Validate scheme and DNS for initial URL
  const parsed = validateScheme(url);
  await validateDns(parsed.hostname);

  let currentUrl = url;
  let redirectsFollowed = 0;

  while (true) {
    const signal = AbortSignal.timeout(timeoutMs);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: 'manual',
        signal,
        headers: { 'User-Agent': 'BypassHire/1.0' },
      });
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      if (
        message.toLowerCase().includes('abort') ||
        message.toLowerCase().includes('timeout') ||
        (err as Error).name === 'AbortError' ||
        (err as Error).name === 'TimeoutError'
      ) {
        throw new Error(`Request timeout: exceeded ${timeoutMs}ms for "${currentUrl}"`);
      }
      throw new Error(`Fetch failed for "${currentUrl}": ${message}`);
    }

    // Handle redirect manually
    if (response.status >= 300 && response.status < 400) {
      if (redirectsFollowed >= maxRedirects) {
        throw new Error(
          `Too many redirects: exceeded maxRedirects (${maxRedirects}) starting from "${url}"`
        );
      }

      const location = response.headers.get('location');
      if (!location) {
        throw new Error(`Redirect response missing Location header from "${currentUrl}"`);
      }

      // Reject relative URLs — require absolute http(s)
      let redirectParsed: URL;
      try {
        redirectParsed = new URL(location);
      } catch {
        throw new Error(
          `Redirect Location is not an absolute URL: "${location}" from "${currentUrl}"`
        );
      }

      // Validate scheme of redirect target
      if (redirectParsed.protocol !== 'http:' && redirectParsed.protocol !== 'https:') {
        throw new Error(
          `Invalid URL scheme in redirect: only http and https are allowed, got "${redirectParsed.protocol}"`
        );
      }

      // DNS-validate the redirect target
      await validateDns(redirectParsed.hostname);

      currentUrl = location;
      redirectsFollowed++;
      continue;
    }

    // Read body with size cap
    if (!response.body) {
      return { body: '', finalUrl: currentUrl };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          reader.cancel().catch(() => {});
          throw new Error(
            `Response size exceeded: body is larger than ${maxBytes} bytes for "${currentUrl}"`
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const body = new TextDecoder().decode(combined);
    return { body, finalUrl: currentUrl };
  }
}
