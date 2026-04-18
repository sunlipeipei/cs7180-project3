import type { IngestJDResponse } from '../ai/schemas';

export const jobDescriptionsFixture: IngestJDResponse[] = [
  {
    // FAANG-tier: Google — used as the "tailored" resume's target JD
    jobDescriptionId: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
    title: 'Senior Software Engineer, Google Cloud Platform',
    company: 'Google',
    parsedAt: '2025-03-15T10:30:00.000Z',
  },
  {
    // Startup-tier: Series B fintech
    jobDescriptionId: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
    title: 'Staff Engineer – Platform',
    company: 'Meridian Financial Technologies',
    parsedAt: '2025-03-18T14:45:00.000Z',
  },
];
