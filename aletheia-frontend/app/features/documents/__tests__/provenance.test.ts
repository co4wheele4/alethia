import { splitFrontmatter, parseProvenanceFromChunk0 } from '../provenance';

describe('provenance utils', () => {
  describe('splitFrontmatter', () => {
    it('splits content with frontmatter', () => {
      const content = '---\nkey: value\n---\nbody text';
      const result = splitFrontmatter(content);
      expect(result.rawHeader).toBe('---\nkey: value\n---\n');
      expect(result.body).toBe('body text');
    });

    it('returns null header if no frontmatter', () => {
      const content = 'plain body text';
      const result = splitFrontmatter(content);
      expect(result.rawHeader).toBeNull();
      expect(result.body).toBe(content);
    });

    it('returns null header if frontmatter is not closed', () => {
      const content = '---\nkey: value\nbody text';
      const result = splitFrontmatter(content);
      expect(result.rawHeader).toBeNull();
      expect(result.body).toBe(content);
    });
  });

  describe('parseProvenanceFromChunk0', () => {
    it('parses simple provenance', () => {
      const content = '---\ningestedAt: "2023-01-01"\ncontentSha256: "abc"\nsource:\n  kind: "file"\n  filename: "test.txt"\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.ingestedAt).toBe('2023-01-01');
      expect(result.provenance?.contentSha256).toBe('abc');
      expect(result.provenance?.source?.kind).toBe('file');
      expect(result.provenance?.source?.filename).toBe('test.txt');
      expect(result.body).toBe('Body');
    });

    it('handles numeric values', () => {
      const content = '---\nsizeBytes: 12345\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.sizeBytes).toBe(12345);
    });

    it('handles empty header inner lines', () => {
      const content = '---\n\nkey: value\n\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.key).toBe('value');
    });

    it('handles non-matching lines in header', () => {
      const content = '---\ninvalid line\nkey: value\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.key).toBe('value');
    });

    it('handles null/undefined INDENT match', () => {
      // This is to test m[1] being null/undefined if that regex allowed it
      // but our regex ^(\s*) always matches something (empty string).
      const content = '---\nkey: value\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.key).toBe('value');
    });

    it('removes invalid well-known fields', () => {
      const content = '---\ningestedAt: 123\nsource:\n  kind: 456\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.ingestedAt).toBeUndefined();
      expect(result.provenance?.source?.kind).toBeUndefined();
    });

    it('handles nested source fields and normalization', () => {
      const content = `---
source:
  kind: "url"
  publisher: null
  author: "Test Author"
  contentType: "text/html"
  publishedAt: "2023-01-01"
---
Body`;
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.source?.kind).toBe('url');
      expect(result.provenance?.source?.publisher).toBeNull();
      expect(result.provenance?.source?.author).toBe('Test Author');
      expect(result.provenance?.source?.contentType).toBe('text/html');
      expect(result.provenance?.source?.publishedAt).toBe('2023-01-01');
    });

    it('removes invalid normalization fields', () => {
      const content = `---
source:
  kind: 123
  publisher: 456
  author: 789
  contentType: 0
  publishedAt: 1
---
Body`;
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.source?.kind).toBeUndefined();
      expect(result.provenance?.source?.publisher).toBeUndefined();
      expect(result.provenance?.source?.author).toBeUndefined();
      expect(result.provenance?.source?.contentType).toBeUndefined();
      expect(result.provenance?.source?.publishedAt).toBeUndefined();
    });

    it('handles indent < 2 when inSource is true', () => {
      const content = `---
source:
 key: value
---
Body`;
      // indent 1 is < 2, so it shouldn't be added to source if we only support indent >= 2
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.source).toEqual({});
      expect((result.provenance as any).key).toBeUndefined();
    });

    it('handles indent >= 2 when inSource is false', () => {
      const content = `---
notSource:
  key: value
---
Body`;
      const result = parseProvenanceFromChunk0(content);
      expect((result.provenance as any).notSource).toBe('');
      // indent >= 2 but not inSource, should continue
      expect((result.provenance as any).key).toBeUndefined();
    });

    it('handles falsy rawHeader in parseProvenanceFromChunk0', () => {
      // splitFrontmatter returning null rawHeader
      const result = parseProvenanceFromChunk0('no frontmatter');
      expect(result.provenance).toBeNull();
      expect(result.rawHeader).toBeNull();
      expect(result.body).toBe('no frontmatter');
    });

    it('handles single quoted strings via catch block', () => {
      const content = "---\nkey: 'single quoted value'\n---\nBody";
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.key).toBe('single quoted value');
    });

    it('handles double quoted strings via JSON.parse', () => {
      const content = '---\nkey: "double quoted value"\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.key).toBe('double quoted value');
    });

    it('handles empty quoted strings', () => {
      const content = '---\nkey: ""\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.key).toBe('');
    });

    it('handles source key with trailing space', () => {
      const content = '---\nsource: \n  kind: file\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.source?.kind).toBe('file');
    });

    it('handles null literal and empty strings', () => {
      const content = '---\nkey1: null\nkey2:\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.key1).toBeNull();
      expect(result.provenance?.key2).toBe('');
    });

    it('handles multiple nested fields to cover prov.source initialization', () => {
      const content = '---\nsource:\n  kind: file\n  filename: test.txt\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.source?.kind).toBe('file');
      expect(result.provenance?.source?.filename).toBe('test.txt');
    });

    it('handles booleans explicitly', () => {
      const content = '---\nsource:\n  confirmed: true\n  verified: false\n---\nBody';
      const result = parseProvenanceFromChunk0(content);
      expect(result.provenance?.source?.confirmed).toBe(true);
      expect(result.provenance?.source?.verified).toBe(false);
    });
  });
});
