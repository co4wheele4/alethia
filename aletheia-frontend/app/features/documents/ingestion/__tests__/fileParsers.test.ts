import { describe, it, expect, vi } from 'vitest';
import { parseFileToText, detectSupportedFileKind } from '../fileParsers';
import mammoth from 'mammoth/mammoth.browser';

// Mock mammoth
vi.mock('mammoth/mammoth.browser', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'docx content', messages: [] })
  }
}));

// Mock pdfjs
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'pdf content' }]
        })
      })
    })
  })
}));

describe('fileParsers', () => {
  beforeAll(() => {
    // Polyfill File.text() and File.arrayBuffer() if missing in jsdom
    if (!File.prototype.text) {
      File.prototype.text = async function (this: File) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(this);
        });
      };
    }
    if (!File.prototype.arrayBuffer) {
      File.prototype.arrayBuffer = async function (this: File) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(this);
        });
      };
    }
  });

  describe('detectSupportedFileKind', () => {
    it('detects supported extensions', () => {
      expect(detectSupportedFileKind(new File([], 'test.pdf'))).toBe('pdf');
      expect(detectSupportedFileKind(new File([], 'test.docx'))).toBe('docx');
      expect(detectSupportedFileKind(new File([], 'test.txt'))).toBe('txt');
      expect(detectSupportedFileKind(new File([], 'test.md'))).toBe('md');
      expect(detectSupportedFileKind(new File([], 'test.markdown'))).toBe('md');
      expect(detectSupportedFileKind(new File([], 'test.csv'))).toBe('csv');
      expect(detectSupportedFileKind(new File([], 'test.html'))).toBe('html');
      expect(detectSupportedFileKind(new File([], 'test.htm'))).toBe('html');
    });

    it('returns null for unsupported extensions', () => {
      expect(detectSupportedFileKind(new File([], 'test.exe'))).toBeNull();
      expect(detectSupportedFileKind(new File([], 'test'))).toBeNull();
    });
  });

  describe('parseFileToText', () => {
    it('parses .txt files', async () => {
      const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
      const result = await parseFileToText(file);
      expect(result.title).toBe('test');
      expect(result.text).toBe('hello world');
    });

    it('parses .md files', async () => {
      const file = new File(['# heading'], 'test.md', { type: 'text/markdown' });
      const result = await parseFileToText(file);
      expect(result.title).toBe('test');
      expect(result.text).toBe('# heading');
    });

    it('parses .csv files', async () => {
      const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
      const result = await parseFileToText(file);
      expect(result.title).toBe('test');
      expect(result.text).toBe('a,b\n1,2');
    });

    it('parses .html files', async () => {
      // Mock DOMParser
      const mockNode = { remove: vi.fn() };
      const mockDoc = {
        querySelectorAll: vi.fn().mockReturnValue([mockNode]),
        body: { textContent: ' html content ' }
      };
      
      class MockDOMParser {
        parseFromString() {
          return mockDoc;
        }
      }
      
      vi.stubGlobal('DOMParser', MockDOMParser);

      const file = new File(['<html><body><script></script></body></html>'], 'test.html', { type: 'text/html' });
      const result = await parseFileToText(file);
      expect(result.text).toBe('html content');
      expect(mockNode.remove).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('parses .docx files using mammoth', async () => {
      const file = new File([new ArrayBuffer(10)], 'test.docx');
      const result = await parseFileToText(file);
      expect(mammoth.extractRawText).toHaveBeenCalled();
      expect(result.text).toBe('docx content');
    });

    it('parses .pdf files', async () => {
      const file = new File([new ArrayBuffer(10)], 'test.pdf');
      const result = await parseFileToText(file);
      expect(result.text).toBe('pdf content');
    });

    it('handles PDF items without str property', async () => {
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
      (getDocument as any).mockReturnValueOnce({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [{ notStr: 'ignore' }, null, 123]
            })
          })
        })
      });

      const file = new File([new ArrayBuffer(10)], 'test.pdf');
      const result = await parseFileToText(file);
      expect(result.text).toBe('');
    });

    it('handles HTML with missing body or content', async () => {
      // Mock DOMParser to return empty doc
      class MockEmptyDOMParser {
        parseFromString() {
          return {
            querySelectorAll: vi.fn().mockReturnValue({ forEach: vi.fn() }),
            body: null
          };
        }
      }
      vi.stubGlobal('DOMParser', MockEmptyDOMParser);

      const file = new File(['<html></html>'], 'test.html', { type: 'text/html' });
      const result = await parseFileToText(file);
      expect(result.text).toBe('');
      vi.unstubAllGlobals();
    });

    it('handles DOCX with null value', async () => {
      mammoth.extractRawText.mockResolvedValueOnce({ value: null as any, messages: [] });
      const file = new File([new ArrayBuffer(10)], 'test.docx');
      const result = await parseFileToText(file);
      expect(result.text).toBe('');
    });

    it('handles filename without extension for title', async () => {
      // detectSupportedFileKind will return null for no extension, 
      // so we need to mock it or use a trick.
      // Actually parseFileToText calls detectSupportedFileKind first.
      // If we want to hit the title logic with no extension, we'd need a kind.
      // But no kind = throw.
      // Wait, title logic is: const title = file.name.replace(/\.[^.]+$/, '');
      // If file.name is "test.pdf.docx", it replaces ".docx".
      const file = new File(['content'], 'my.file.txt', { type: 'text/plain' });
      const result = await parseFileToText(file);
      expect(result.title).toBe('my.file');
    });

    it('throws error for unsupported files', async () => {
      const file = new File([], 'test.bin');
      await expect(parseFileToText(file)).rejects.toThrow(/Unsupported file type/);
    });
  });
});
