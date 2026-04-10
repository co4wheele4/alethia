import { evidenceRawBodySha256Hex } from './evidence-raw-body-hash';

describe('evidenceRawBodySha256Hex', () => {
  it('returns a 64-char hex SHA-256 of the buffer', () => {
    const h = evidenceRawBodySha256Hex(Buffer.from('abc'));
    expect(h).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
