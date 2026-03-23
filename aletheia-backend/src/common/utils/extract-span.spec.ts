import { extractSpan } from './extract-span';

describe('extractSpan', () => {
  it('extracts substring by start and end offsets', () => {
    expect(extractSpan('hello world', 0, 5)).toBe('hello');
    expect(extractSpan('hello world', 6, 11)).toBe('world');
    expect(extractSpan('hello world', 2, 8)).toBe('llo wo');
  });

  it('returns empty string when start equals end', () => {
    expect(extractSpan('hello', 2, 2)).toBe('');
  });
});
