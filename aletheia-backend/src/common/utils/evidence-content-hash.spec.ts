import { evidenceContentSha256Hex } from './evidence-content-hash';

describe('evidenceContentSha256Hex', () => {
  it('is stable for UTF-8 input (ADR-024)', () => {
    expect(evidenceContentSha256Hex('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});
