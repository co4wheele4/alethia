import { describe, expect, it } from 'vitest';

import { findAdr038ForbiddenUiMatches } from '../adr038ForbiddenUi';

describe('adr038ForbiddenUi (lexicon parity)', () => {
  it('flags marketing-style drift strings', () => {
    expect(findAdr038ForbiddenUiMatches('Best match for your query').length).toBeGreaterThan(0);
    expect(findAdr038ForbiddenUiMatches('This is weak evidence for the claim').length).toBeGreaterThan(0);
    expect(findAdr038ForbiddenUiMatches('Priority sort').length).toBeGreaterThan(0);
  });

  it('does not flag structural ordering labels', () => {
    expect(findAdr038ForbiddenUiMatches('Created time (oldest first)')).toEqual([]);
    expect(findAdr038ForbiddenUiMatches('Id ascending')).toEqual([]);
  });
});
