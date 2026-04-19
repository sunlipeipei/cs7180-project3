import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { TailoredResume } from '../ai/schemas';

// Order matches ResumeSectionEnum so iteration stays stable.
const SECTIONS = ['header', 'summary', 'skills', 'experience', 'education', 'projects'] as const;
type SectionKey = (typeof SECTIONS)[number];

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0f172a',
  },
  section: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#64748b',
    marginBottom: 6,
  },
  heading1: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  heading2: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    lineHeight: 1.4,
    marginBottom: 4,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletMark: {
    width: 10,
  },
  bulletText: {
    flex: 1,
    lineHeight: 1.35,
  },
});

function humanLabel(section: SectionKey): string {
  return section.charAt(0).toUpperCase() + section.slice(1);
}

/**
 * Minimal markdown-ish renderer. Handles the three constructs the tailor
 * prompt produces: `# heading`, `## subheading`, `- bullet`. Anything
 * else renders as a plain paragraph. This is intentionally simple — we
 * are not a full markdown AST.
 */
function renderMarkdownBlock(markdown: string, keyPrefix: string) {
  const lines = markdown.split('\n');
  const nodes: React.ReactNode[] = [];
  let buffer: string[] = [];

  const flushParagraph = () => {
    if (buffer.length === 0) return;
    const text = buffer.join(' ').trim();
    buffer = [];
    if (!text) return;
    nodes.push(
      <Text key={`${keyPrefix}-p-${nodes.length}`} style={styles.paragraph}>
        {text}
      </Text>
    );
  };

  lines.forEach((raw, i) => {
    const line = raw.replace(/\s+$/, '');
    if (line.trim().length === 0) {
      flushParagraph();
      return;
    }
    if (line.startsWith('# ')) {
      flushParagraph();
      nodes.push(
        <Text key={`${keyPrefix}-h1-${i}`} style={styles.heading1}>
          {line.slice(2).trim()}
        </Text>
      );
    } else if (line.startsWith('## ')) {
      flushParagraph();
      nodes.push(
        <Text key={`${keyPrefix}-h2-${i}`} style={styles.heading2}>
          {line.slice(3).trim()}
        </Text>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph();
      nodes.push(
        <View key={`${keyPrefix}-b-${i}`} style={styles.bullet}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{line.slice(2).trim()}</Text>
        </View>
      );
    } else {
      buffer.push(line.trim());
    }
  });
  flushParagraph();

  return nodes;
}

interface Props {
  resume: TailoredResume;
}

export function ResumeTemplate({ resume }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {SECTIONS.map((section) => {
          const markdown = resume[section];
          if (!markdown || markdown.trim().length === 0) return null;
          return (
            <View key={section} style={styles.section}>
              <Text style={styles.sectionHeading}>{humanLabel(section)}</Text>
              {renderMarkdownBlock(markdown, section)}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
