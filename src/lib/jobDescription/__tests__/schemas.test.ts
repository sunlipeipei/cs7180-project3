import { describe, it, expect } from 'vitest';
import { CreateJdInput } from '../schemas';

describe('CreateJdInput schema', () => {
  it('rejects empty string', () => {
    const result = CreateJdInput.safeParse({ input: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('input is required');
    }
  });

  it('rejects whitespace-only string (after trim)', () => {
    const result = CreateJdInput.safeParse({ input: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('input is required');
    }
  });

  it('rejects missing input field', () => {
    const result = CreateJdInput.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-string input', () => {
    const result = CreateJdInput.safeParse({ input: 42 });
    expect(result.success).toBe(false);
  });

  it('rejects input exceeding 60000 chars', () => {
    const result = CreateJdInput.safeParse({ input: 'a'.repeat(60001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('input exceeds 60k chars');
    }
  });

  it('accepts valid input and returns trimmed value', () => {
    const result = CreateJdInput.safeParse({ input: '  Senior Engineer at Acme  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.input).toBe('Senior Engineer at Acme');
    }
  });

  it('accepts valid input at exactly 60000 chars', () => {
    const result = CreateJdInput.safeParse({ input: 'a'.repeat(60000) });
    expect(result.success).toBe(true);
  });
});
