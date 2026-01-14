/**
 * Client-side file parsing for ingestion.
 *
 * Important: users never interact with "files" after ingestion; we immediately
 * convert them into a text snapshot and send it through the chunk pipeline.
 */
'use client';

import mammoth from 'mammoth/mammoth.browser';

export type ParsedText = {
  title: string;
  text: string;
};

export type SupportedFileKind = 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'html';

function extOf(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
}

export function detectSupportedFileKind(file: File): SupportedFileKind | null {
  const ext = extOf(file.name);
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt') return 'txt';
  if (ext === 'md' || ext === 'markdown') return 'md';
  if (ext === 'csv') return 'csv';
  if (ext === 'html' || ext === 'htm') return 'html';
  return null;
}

async function readAsText(file: File): Promise<string> {
  return await file.text();
}

function htmlToText(html: string): string {
  // DOMParser is available in the browser. This is a best-effort extraction.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Remove script/style for cleaner extraction.
  doc.querySelectorAll('script,style,noscript').forEach((n) => n.remove());
  return (doc.body?.textContent ?? '').replace(/\s+\n/g, '\n').trim();
}

async function parsePdf(file: File): Promise<string> {
  // Lazy import to avoid pulling ESM-only code into Jest/node at import time.
  const mod = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const getDocument = mod.getDocument as typeof mod.getDocument;

  const buffer = await file.arrayBuffer();
  // Disable worker to avoid bundler/worker config complexity; acceptable for typical docs.
  const init = { data: buffer, disableWorker: true } as unknown;
  const pdf = await getDocument(init as Parameters<typeof getDocument>[0]).promise;

  const pages: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((it) => {
        if (typeof it === 'object' && it && 'str' in it) {
          return String((it as { str: unknown }).str);
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
    pages.push(text.trim());
  }

  return pages.filter(Boolean).join('\n\n');
}

async function parseDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return (result.value ?? '').trim();
}

export async function parseFileToText(file: File): Promise<ParsedText> {
  const kind = detectSupportedFileKind(file);
  if (!kind) {
    throw new Error(
      `Unsupported file type. Supported: PDF, DOCX, TXT/MD, CSV, HTML. (Got: ${file.name})`
    );
  }

  const title = file.name.replace(/\.[^.]+$/, '');

  if (kind === 'pdf') {
    return { title, text: await parsePdf(file) };
  }
  if (kind === 'docx') {
    return { title, text: await parseDocx(file) };
  }

  const raw = await readAsText(file);
  if (kind === 'html') {
    return { title, text: htmlToText(raw) };
  }

  // txt/md/csv: ingest as-is (CSV is still text; downstream can interpret structure).
  return { title, text: raw.trim() };
}

