import { AletheiaBundleResolver } from './aletheia-bundle.resolver';
import { AletheiaBundleService } from '../../bundle/aletheia-bundle.service';
import { ClaimStatus } from '@prisma/client';

describe('AletheiaBundleResolver', () => {
  let resolver: AletheiaBundleResolver;
  let exportBundle: jest.Mock;
  let importBundle: jest.Mock;

  beforeEach(() => {
    exportBundle = jest.fn();
    importBundle = jest.fn();
    resolver = new AletheiaBundleResolver({
      exportBundle,
      importBundle,
    } as unknown as AletheiaBundleService);
  });

  it('exportBundle delegates', async () => {
    exportBundle.mockResolvedValue({ version: '1' });
    const r = await resolver.exportBundle({
      claimIds: ['c1'],
      lifecycle: ClaimStatus.DRAFT,
    } as any);
    expect(r).toEqual({ version: '1' });
  });

  it('importBundle delegates', async () => {
    importBundle.mockResolvedValue({ importedClaims: 1, importedEvidence: 0 });
    const r = await resolver.importBundle({
      bundle: { version: '1' },
      allowOverwrite: false,
    } as any);
    expect(r.importedClaims).toBe(1);
  });
});
