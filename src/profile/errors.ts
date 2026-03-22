import { ZodError } from 'zod';

export class ProfileValidationError extends Error {
  public readonly issues: string[];

  constructor(zodError: ZodError) {
    const issues = zodError.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    super(`Profile validation failed:\n  ${issues.join('\n  ')}`);
    this.name = 'ProfileValidationError';
    this.issues = issues;
  }
}

export class ProfileNotFoundError extends Error {
  constructor(path: string) {
    super(`Profile not found: ${path}`);
    this.name = 'ProfileNotFoundError';
  }
}

export class ProfileIOError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ProfileIOError';
  }
}
