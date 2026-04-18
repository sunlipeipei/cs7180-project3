import type { MasterProfile } from '../ai/schemas';

export const profileFixture: MasterProfile = {
  schemaVersion: 1,
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
  phone: '+1-415-555-0192',
  address: {
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
  },
  links: {
    github: 'https://github.com/jordanlee-dev',
    linkedin: 'https://linkedin.com/in/jordanlee-dev',
    portfolio: 'https://jordanlee.dev',
  },
  summary:
    'Full-stack software engineer with 6+ years of experience building scalable web applications and distributed systems. Passionate about developer tooling, AI-assisted workflows, and shipping products that reduce friction for end users. Thrives in collaborative, fast-moving environments where ownership and craft are equally valued.',

  skills: [
    { name: 'TypeScript', category: 'Languages', level: 'Expert' },
    { name: 'Python', category: 'Languages', level: 'Advanced' },
    { name: 'Go', category: 'Languages', level: 'Intermediate' },
    { name: 'React', category: 'Frontend', level: 'Expert' },
    { name: 'Next.js', category: 'Frontend', level: 'Expert' },
    { name: 'Node.js', category: 'Backend', level: 'Expert' },
    { name: 'PostgreSQL', category: 'Databases', level: 'Advanced' },
    { name: 'Redis', category: 'Databases', level: 'Advanced' },
    { name: 'Docker', category: 'Infrastructure', level: 'Advanced' },
    { name: 'Kubernetes', category: 'Infrastructure', level: 'Intermediate' },
    { name: 'AWS (EC2, S3, Lambda)', category: 'Cloud', level: 'Advanced' },
    { name: 'GraphQL', category: 'API Design', level: 'Advanced' },
  ],

  workExperience: [
    {
      company: 'Stripe',
      title: 'Senior Software Engineer',
      startDate: '2022-03-01',
      endDate: null,
      location: 'San Francisco, CA (Remote-optional)',
      descriptions: [
        'Led the redesign of the payment intent lifecycle API, reducing average checkout latency by 18% across all SDK clients.',
        'Designed and shipped a TypeScript-first developer SDK used by 40,000+ merchants, replacing a legacy JavaScript library.',
        'Mentored three junior engineers through bi-weekly 1:1s and code-review sessions; two were promoted within 12 months.',
        'Collaborated with product and design to define API contracts for the new Adaptive Acceptance ML pipeline.',
      ],
    },
    {
      company: 'Shopify',
      title: 'Software Engineer II',
      startDate: '2019-07-15',
      endDate: '2022-02-28',
      location: 'Toronto, ON (Hybrid)',
      descriptions: [
        'Built the storefront-search indexing pipeline in Go, processing 2M+ product updates per hour with sub-200 ms p99 latency.',
        'Migrated a 10-year-old Rails monolith section to a microservices architecture on Kubernetes, eliminating 3 weekly incident pages.',
        'Contributed to the open-source Polaris design-system library; authored 12 merged PRs and maintained the icon pipeline.',
      ],
    },
    {
      company: 'Accenture',
      title: 'Software Engineer',
      startDate: '2017-08-01',
      endDate: '2019-06-30',
      location: 'New York, NY',
      descriptions: [
        'Developed REST APIs for a Fortune 500 retail client using Node.js and Express, serving 5M daily active users.',
        'Automated deployment pipelines with Jenkins and Ansible, cutting release cycle time from 2 weeks to 3 days.',
      ],
    },
  ],

  education: [
    {
      school: 'University of Waterloo',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2013-09-01',
      endDate: '2017-04-30',
      gpa: '3.82',
    },
  ],

  projects: [
    {
      name: 'BypassHire',
      description:
        'AI-powered job application automation tool that tailors resumes to job descriptions using Claude and auto-fills Workday forms via a Chrome extension. Reduced per-application time from 45 minutes to under 5 minutes.',
      technologies: ['TypeScript', 'Next.js', 'Prisma', 'PostgreSQL', 'Anthropic Claude API'],
      url: 'https://github.com/jordanlee-dev/bypasshire',
      startDate: '2024-10-01',
      role: 'Solo author',
    },
    {
      name: 'Temporal Graph Store',
      description:
        'An open-source, append-only graph database built on top of RocksDB that supports bi-temporal queries and point-in-time snapshots. Used in production by two YC-backed startups.',
      technologies: ['Go', 'RocksDB', 'gRPC', 'Protocol Buffers'],
      url: 'https://github.com/jordanlee-dev/temporal-graph',
      startDate: '2021-04-01',
      endDate: '2023-01-15',
      role: 'Primary contributor',
    },
    {
      name: 'LLM Prompt Observatory',
      description:
        'A self-hosted web app for logging, diffing, and replaying LLM prompts across model versions. Integrates with OpenAI, Anthropic, and Mistral APIs.',
      technologies: ['Python', 'FastAPI', 'React', 'SQLite', 'Docker'],
      url: 'https://github.com/jordanlee-dev/prompt-observatory',
      startDate: '2023-06-01',
      endDate: '2024-03-31',
      role: 'Creator',
    },
  ],

  certifications: [
    {
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      date: '2021-11-10',
      expirationDate: '2024-11-10',
      credentialId: 'AWS-SAA-20211110-JLEE',
    },
    {
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      date: '2023-03-22',
      credentialId: 'CKA-2023-0322-JL',
    },
  ],

  contextSources: {
    githubRepos: [
      'https://github.com/jordanlee-dev/bypasshire',
      'https://github.com/jordanlee-dev/temporal-graph',
    ],
    documentPaths: [],
  },
};
