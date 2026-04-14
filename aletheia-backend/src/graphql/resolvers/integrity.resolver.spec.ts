import { IntegrityResolver } from './integrity.resolver';
import { IntegrityService } from '../../integrity/integrity.service';

describe('IntegrityResolver', () => {
  it('validateIntegrity delegates to IntegrityService and ignores workspace id until ADR-035', async () => {
    const out = {
      adjudicationMissingHashCount: 1,
      adjudicationBrokenChainCount: 0,
      adjudicationHashMismatchCount: 0,
      evidenceMissingContentHashCount: 2,
    };
    const validateAdjudicationChain = jest.fn().mockResolvedValue(out);
    const resolver = new IntegrityResolver({
      validateAdjudicationChain,
    } as unknown as IntegrityService);

    const r = await resolver.validateIntegrity(
      '00000000-0000-0000-0000-000000000001',
    );
    expect(validateAdjudicationChain).toHaveBeenCalledTimes(1);
    expect(r).toEqual(out);
  });
});
