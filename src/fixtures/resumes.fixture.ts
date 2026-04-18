import type { TailoredResume } from '../ai/schemas';
import { jobDescriptionsFixture } from './jobDescriptions.fixture';

export const resumesFixture: TailoredResume[] = [
  {
    // Draft resume — minimal content, mostly placeholder sections
    resumeId: 'c3d4e5f6-a7b8-4901-8def-012345678901',
    jobDescriptionId: 'f7e6d5c4-b3a2-4198-89ab-543210fedcba',
    header: '# Jordan Lee\njordan.lee@example.com | +1-415-555-0192 | San Francisco, CA',
    summary: '_[Summary to be tailored to role]_',
    skills: '_[Skills section pending review]_',
    experience: '_[Work experience to be tailored]_',
    education: '## Education\n\n**B.S. Computer Science** — University of Waterloo, 2017',
    projects: '_[Projects to be selected and tailored]_',
    updatedAt: '2025-03-14T09:00:00.000Z',
  },
  {
    // Fully tailored resume — rich markdown for every section, targeting Google SWE JD
    resumeId: 'd4e5f6a7-b8c9-4012-8efa-123456789012',
    jobDescriptionId: jobDescriptionsFixture[0].jobDescriptionId, // 'a1b2c3d4-...' — Google
    header: [
      '# Jordan Lee',
      'jordan.lee@example.com | +1-415-555-0192 | San Francisco, CA',
      '[GitHub](https://github.com/jordanlee-dev) | [Portfolio](https://jordanlee.dev) | [LinkedIn](https://linkedin.com/in/jordanlee-dev)',
    ].join('\n'),
    summary: [
      'Senior software engineer with 6+ years of experience building high-throughput, globally distributed systems at',
      'Stripe and Shopify. Deep expertise in Go and TypeScript across API platform engineering, developer SDKs, and',
      'cloud-native infrastructure. Excited to bring payment-scale reliability and developer-experience craft to Google Cloud Platform.',
    ].join(' '),
    skills: [
      '## Technical Skills',
      '',
      '| Category | Technologies |',
      '|---|---|',
      '| Languages | TypeScript (Expert), Go (Advanced), Python (Advanced) |',
      '| Cloud & Infra | GCP, AWS (EC2/S3/Lambda), Kubernetes, Docker |',
      '| Databases | PostgreSQL, Redis, RocksDB, BigQuery |',
      '| APIs & Protocols | REST, GraphQL, gRPC, Protocol Buffers |',
      '| Observability | OpenTelemetry, Prometheus, Datadog |',
    ].join('\n'),
    experience: [
      '## Work Experience',
      '',
      '### Senior Software Engineer — Stripe _(Mar 2022 – Present)_',
      '- Redesigned the Payment Intent lifecycle API, cutting average checkout latency **18%** across all SDK clients.',
      '- Authored a TypeScript-first developer SDK now used by **40,000+ merchants**, replacing a deprecated JS library.',
      '- Defined API contracts for the Adaptive Acceptance ML pipeline in collaboration with product and ML teams.',
      '- Mentored 3 junior engineers; 2 promoted within 12 months.',
      '',
      '### Software Engineer II — Shopify _(Jul 2019 – Feb 2022)_',
      '- Built a storefront-search indexing pipeline in **Go** processing **2M+ product updates/hour** at sub-200 ms p99.',
      '- Migrated a decade-old Rails monolith section to microservices on Kubernetes, eliminating 3 weekly incident pages.',
      '- Contributed 12 merged PRs to the open-source Polaris design-system library.',
      '',
      '### Software Engineer — Accenture _(Aug 2017 – Jun 2019)_',
      '- Developed Node.js REST APIs serving **5M daily active users** for a Fortune 500 retail client.',
      '- Automated CI/CD with Jenkins and Ansible, cutting release cycles from 2 weeks to 3 days.',
    ].join('\n'),
    education: [
      '## Education',
      '',
      '**Bachelor of Science, Computer Science** | University of Waterloo | 2013 – 2017 | GPA: 3.82',
    ].join('\n'),
    projects: [
      '## Selected Projects',
      '',
      '### [BypassHire](https://github.com/jordanlee-dev/bypasshire)',
      'AI-powered resume tailoring and Workday auto-fill tool. Built on Next.js, Prisma, PostgreSQL, and Claude API.',
      'Reduced per-application effort from 45 min to under 5 min.',
      '',
      '### [Temporal Graph Store](https://github.com/jordanlee-dev/temporal-graph)',
      'Open-source append-only graph database in Go (RocksDB + gRPC) with bi-temporal query support.',
      'Adopted by two YC-backed startups in production.',
    ].join('\n'),
    updatedAt: '2025-03-16T17:22:00.000Z',
  },
];
