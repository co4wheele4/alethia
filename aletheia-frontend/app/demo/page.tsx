import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

function readWalkthrough(): string {
  const candidates = [
    join(
      /* turbopackIgnore: true */ process.cwd(),
      '..',
      'docs',
      'demo',
      'feature-walkthrough.md',
    ),
    join(
      /* turbopackIgnore: true */ process.cwd(),
      'docs',
      'demo',
      'feature-walkthrough.md',
    ),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return readFileSync(p, 'utf8');
    }
  }
  return [
    '# Feature demo walkthrough',
    '',
    'Could not read `docs/demo/feature-walkthrough.md`.',
    'Run the Next.js app from `aletheia-frontend` inside the monorepo so the docs path resolves.',
  ].join('\n');
}

export default function DemoPage() {
  const text = readWalkthrough();

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <p style={{ color: 'var(--mui-palette-text-secondary, #666)', fontSize: 14, marginBottom: 16 }}>
        Repository copy: <code>docs/demo/feature-walkthrough.md</code>. Also linked from the dashboard.
      </p>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)',
          fontSize: 14,
          lineHeight: 1.5,
          margin: 0,
          padding: 16,
          border: '1px solid var(--mui-palette-divider, #ddd)',
          borderRadius: 8,
          maxHeight: 'min(70vh, 720px)',
          overflow: 'auto',
        }}
      >
        {text}
      </pre>
    </div>
  );
}
