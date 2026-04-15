/**
 * ADR governance compliance (mechanical):
 * - Normalized status on every ADR markdown file
 * - ACCEPTED ADRs must not reference any SUPERSEDED ADR
 * - SUPERSEDED ADRs must declare SupersededBy pointing to a non-SUPERSEDED ADR
 * - docs/adr/index.json must list ADR-001..ADR-038
 */

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');
const ADR_DIR = path.join(REPO_ROOT, 'docs', 'adr');
const INDEX_PATH = path.join(ADR_DIR, 'index.json');

const ALLOWED_STATUS = new Set([
  'ACCEPTED',
  'PROPOSED',
  'REJECTED',
  'SUPERSEDED',
]);

function listAdrMarkdownFiles(): string[] {
  return fs
    .readdirSync(ADR_DIR)
    .filter((f) => /^ADR-\d{3}-.+\.md$/i.test(f))
    .map((f) => path.join(ADR_DIR, f));
}

function adrIdFromFilename(filePath: string): string {
  const base = path.basename(filePath);
  const m = base.match(/^ADR-(\d{3})/i);
  if (!m) throw new Error(`Bad ADR filename: ${base}`);
  return `ADR-${m[1]}`;
}

function extractStatus(markdown: string): string | null {
  const block = markdown.match(
    /## Status\s*\r?\n([\s\S]*?)(?=\r?\n## |\r?\n# |\r?\n*$)/,
  );
  if (!block) return null;
  const m = block[1].match(/^\s*Status:\s*(\S+)/m);
  return m ? m[1].trim().toUpperCase() : null;
}

function extractSupersededBy(markdown: string): string | null {
  const block = markdown.match(
    /## SupersededBy\s*\r?\n([\s\S]*?)(?=\r?\n## |\r?\n# |\r?\n*$)/,
  );
  if (!block) return null;
  const line = block[1].trim().split(/\r?\n/)[0]?.trim() ?? '';
  if (!line || /^none$/i.test(line)) return null;
  const m = line.match(/^ADR-(\d{3})$/i);
  return m ? `ADR-${m[1]}` : null;
}

function collectAdrRefs(markdown: string): Set<string> {
  const out = new Set<string>();
  const re = /\bADR-(\d{3})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    out.add(`ADR-${m[1]}`);
  }
  return out;
}

describe('ADR governance compliance', () => {
  it('meets status, supersession, and cross-reference rules', () => {
    const files = listAdrMarkdownFiles();
    expect(files.length).toBeGreaterThan(0);

    const statusById: Record<string, string> = {};
    const contentById: Record<string, string> = {};

    for (const file of files) {
      const id = adrIdFromFilename(file);
      const text = fs.readFileSync(file, 'utf8');
      contentById[id] = text;
      const st = extractStatus(text);
      if (st === null) {
        throw new Error(`Missing status: ${file}`);
      }
      if (!ALLOWED_STATUS.has(st)) {
        throw new Error(`Bad status in ${file}: ${st}`);
      }
      statusById[id] = st;
    }

    const supersessionErrors: string[] = [];
    for (const id of Object.keys(statusById)) {
      if (statusById[id] !== 'SUPERSEDED') continue;
      const sb = extractSupersededBy(contentById[id]);
      if (!sb) {
        supersessionErrors.push(`${id}: SUPERSEDED but missing ## SupersededBy ADR-XXX`);
        continue;
      }
      const targetStatus = statusById[sb];
      if (!targetStatus) {
        supersessionErrors.push(`${id}: SupersededBy ${sb} not found`);
        continue;
      }
      if (targetStatus === 'SUPERSEDED') {
        supersessionErrors.push(
          `${id}: SupersededBy ${sb} must not point to another SUPERSEDED ADR`,
        );
      }
    }
    expect(supersessionErrors).toEqual([]);

    const acceptedRefsSuperseded: string[] = [];
    for (const file of files) {
      const ownId = adrIdFromFilename(file);
      if (statusById[ownId] !== 'ACCEPTED') continue;
      const refs = collectAdrRefs(contentById[ownId]);
      for (const ref of refs) {
        if (ref === ownId) continue;
        if (statusById[ref] === 'SUPERSEDED') {
          acceptedRefsSuperseded.push(
            `${path.relative(REPO_ROOT, file)} (${ownId}) references ${ref} (SUPERSEDED)`,
          );
        }
      }
    }
    expect(acceptedRefsSuperseded).toEqual([]);
  });

  it('includes ADR-001..ADR-038 in docs/adr/index.json', () => {
    expect(fs.existsSync(INDEX_PATH)).toBe(true);
    const raw = fs.readFileSync(INDEX_PATH, 'utf8');
    const data = JSON.parse(raw) as { adrs?: Record<string, unknown> };
    expect(data.adrs).toBeDefined();
    for (let n = 1; n <= 38; n += 1) {
      const id = `ADR-${String(n).padStart(3, '0')}`;
      expect(data.adrs).toHaveProperty(id);
    }
  });

  it('maps every ACCEPTED ADR to at least one enforcement path and one test path in index.json', () => {
    const raw = fs.readFileSync(INDEX_PATH, 'utf8');
    const data = JSON.parse(raw) as {
      adrs?: Record<
        string,
        {
          status?: string;
          enforcement?: unknown[];
          tests?: unknown[];
        }
      >;
    };
    expect(data.adrs).toBeDefined();
    const gaps: string[] = [];
    for (const [id, entry] of Object.entries(data.adrs ?? {})) {
      if (entry.status !== 'ACCEPTED') continue;
      if (!entry.enforcement?.length) {
        gaps.push(`${id}: missing or empty enforcement[]`);
      }
      if (!entry.tests?.length) {
        gaps.push(`${id}: missing or empty tests[]`);
      }
    }
    expect(gaps).toEqual([]);
  });
});
