/* eslint-disable no-console */
/**
 * ADR governance hygiene guardrails.
 *
 * Safeguards implemented (strict):
 * (A) Superseded ADR reference detection
 * (B) ADR header status contract enforcement
 *
 * This script is intentionally mechanical and string-based.
 */
const fs = require('node:fs');
const path = require('node:path');

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

function readUtf8(p) {
  return normalizeNewlines(fs.readFileSync(p, 'utf8'));
}

function fail(prefix, message) {
  console.error(`${prefix}: ${message}`);
  process.exitCode = 1;
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function toPosixRel(repoRoot, absPath) {
  return path.relative(repoRoot, absPath).split(path.sep).join('/');
}

function listFilesRecursive(rootDir, opts) {
  const { ignoreDirNames, shouldSkipDirAbsPath } = opts;
  /** @type {string[]} */
  const out = [];

  /** @param {string} dir */
  function walk(dir) {
    if (shouldSkipDirAbsPath(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ignoreDirNames.has(ent.name)) continue;
        walk(abs);
      } else if (ent.isFile()) {
        out.push(abs);
      }
    }
  }

  walk(rootDir);
  return out;
}

function extractAdrIdFromFilename(filename) {
  const m = filename.match(/^(ADR-\d{3})\b/i);
  return m ? m[1].toUpperCase() : null;
}

function findStatusSection(lines) {
  const idx = lines.findIndex((l) => l.trim() === '## Status');
  if (idx === -1) return { statusHeaderLineIdx: -1, sectionLines: [] };

  const sectionLines = [];
  for (let i = idx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().startsWith('## ') && line.trim() !== '## Status') break;
    sectionLines.push(line);
  }
  return { statusHeaderLineIdx: idx, sectionLines };
}

function firstNonEmptyLine(lines) {
  for (const l of lines) {
    const t = l.trim();
    if (t) return t;
  }
  return null;
}

function lineInfoFromIndex(text, idx) {
  // 1-based line number.
  let line = 1;
  for (let i = 0; i < idx; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');

  const adrRoot = path.join(repoRoot, 'docs', 'adr');
  if (!isDir(adrRoot)) {
    fail('ADR_STATUS_CONTRACT', `Missing required ADR directory at ${toPosixRel(repoRoot, adrRoot)}`);
    return;
  }

  // Optional, explicitly-named ADR archive directory (if present).
  const optionalArchiveRoots = [
    path.join(repoRoot, 'docs', 'adr-archive'),
    path.join(repoRoot, 'docs', 'adr_archive'),
    path.join(repoRoot, 'docs', 'adr', 'archive'),
    path.join(repoRoot, 'docs', 'adr', '_archive'),
    path.join(repoRoot, 'docs', 'adr', 'archived'),
  ].filter(isDir);

  const adrRoots = [adrRoot, ...optionalArchiveRoots];

  /** @type {string[]} */
  const adrFiles = [];
  for (const root of adrRoots) {
    const files = listFilesRecursive(root, {
      ignoreDirNames: new Set(['node_modules', '.git']),
      shouldSkipDirAbsPath: () => false,
    });
    for (const f of files) {
      const base = path.basename(f);
      if (/^ADR-\d{3}.*\.md$/i.test(base)) adrFiles.push(f);
    }
  }

  if (adrFiles.length === 0) {
    fail('ADR_STATUS_CONTRACT', `No ADR files found under ${toPosixRel(repoRoot, adrRoot)}.`);
    return;
  }

  /** @type {Set<string>} */
  const supersededAdrIds = new Set();

  // (B) ADR header status contract enforcement
  for (const adrFile of adrFiles) {
    const rel = toPosixRel(repoRoot, adrFile);
    const filename = path.basename(adrFile);
    const adrId = extractAdrIdFromFilename(filename);
    if (!adrId) {
      fail('ADR_STATUS_CONTRACT', `${rel}: ADR filename must start with an ID like ADR-000.`);
      continue;
    }

    const text = readUtf8(adrFile);
    const lines = text.split('\n');
    const { statusHeaderLineIdx, sectionLines } = findStatusSection(lines);
    if (statusHeaderLineIdx === -1) {
      fail('ADR_STATUS_CONTRACT', `${rel}: Missing required "## Status" header.`);
      continue;
    }

    const first = firstNonEmptyLine(sectionLines);
    if (!first) {
      fail('ADR_STATUS_CONTRACT', `${rel}: "## Status" section is empty; expected "Status: ...".`);
      continue;
    }

    const m = first.match(/^Status:\s*(.+)$/);
    if (!m) {
      fail('ADR_STATUS_CONTRACT', `${rel}: First line under "## Status" must be "Status: ...". Found: "${first}".`);
      continue;
    }

    const statusValue = m[1].trim();
    const statusNorm = statusValue.toUpperCase();
    const allowed = new Set(['ACCEPTED', 'REJECTED', 'SUPERSEDED', 'PROPOSED']);
    if (!allowed.has(statusNorm)) {
      fail(
        'ADR_STATUS_CONTRACT',
        `${rel}: Status must be one of ACCEPTED | REJECTED | SUPERSEDED | PROPOSED. Found: "${statusValue}".`,
      );
      continue;
    }

    if (statusNorm === 'SUPERSEDED') {
      supersededAdrIds.add(adrId);

      const mustHave = [
        'historical context only',
        'MUST NOT be enforced',
        'MUST NOT be cited for validation or correctness',
      ];
      for (const phrase of mustHave) {
        if (!text.includes(phrase)) {
          fail(
            'ADR_SUPERSEDED_CONTRACT',
            `${rel}: Superseded ADR must include explicit non-authoritative warning containing "${phrase}".`,
          );
        }
      }
    }
  }

  // (A) Superseded ADR reference detection (outside ADR dir / archive only)
  if (supersededAdrIds.size > 0) {
    const ignoreDirNames = new Set([
      '.git',
      'node_modules',
      'dist',
      'build',
      '.next',
      '.turbo',
      'coverage',
    ]);

    /** @type {Set<string>} */
    const allowedDirRelPrefixes = new Set(adrRoots.map((r) => `${toPosixRel(repoRoot, r).replace(/\/$/, '')}/`));

    /** @param {string} absDir */
    function shouldSkipDirAbsPath(absDir) {
      const relDir = `${toPosixRel(repoRoot, absDir).replace(/\/$/, '')}/`;
      for (const allowedPrefix of allowedDirRelPrefixes) {
        if (relDir.startsWith(allowedPrefix)) return true;
      }
      return false;
    }

    const repoFiles = listFilesRecursive(repoRoot, { ignoreDirNames, shouldSkipDirAbsPath });

    const binaryExts = new Set([
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.webp',
      '.ico',
      '.pdf',
      '.zip',
      '.gz',
      '.tgz',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
      '.mp3',
      '.mp4',
      '.mov',
      '.wav',
    ]);

    const supersededReferenceAllowlistRel = new Set([
      'scripts/publish-adr-index.cjs',
      'scripts/validate-adr-index.cjs',
      'docs/adr/index.json',
    ]);

    for (const absFile of repoFiles) {
      const rel = toPosixRel(repoRoot, absFile);
      if (supersededReferenceAllowlistRel.has(rel)) continue;
      const ext = path.extname(absFile).toLowerCase();
      if (binaryExts.has(ext)) continue;

      let text;
      try {
        text = readUtf8(absFile);
      } catch {
        // Non-utf8 or unreadable file: ignore (deterministically) rather than inferring semantics.
        continue;
      }

      for (const adrId of supersededAdrIds) {
        const idx = text.indexOf(adrId);
        if (idx !== -1) {
          const line = lineInfoFromIndex(text, idx);
          fail(
            'ADR_SUPERSEDED_REFERENCE',
            `${rel}:${line}: Found reference to superseded ADR "${adrId}" outside ADR docs/archive. ` +
              `Superseded ADRs are historical only and MUST NOT be referenced as normative.`,
          );
        }
      }
    }
  }

  if (process.exitCode !== 1) {
    console.log('ADR governance checks passed.');
  }
}

main();

