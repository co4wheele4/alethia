import { EntityRelationshipEvidenceResolver } from './entity-relationship-evidence.resolver';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('EntityRelationshipEvidenceResolver', () => {
  let resolver: EntityRelationshipEvidenceResolver;
  let dataLoaders: jest.Mocked<DataLoaderService>;

  beforeEach(() => {
    dataLoaders = {
      getDocumentChunkLoader: jest.fn(),
      getEvidenceMentionLinksByEvidenceLoader: jest.fn(),
    } as unknown as jest.Mocked<DataLoaderService>;

    resolver = new EntityRelationshipEvidenceResolver(dataLoaders);
  });

  it('should resolve chunk via DataLoader using chunkId', async () => {
    const load = jest.fn().mockResolvedValue({ id: 'chunk-1' });
    dataLoaders.getDocumentChunkLoader.mockReturnValue({ load } as any);

    const evidence = { id: 'ev-1', chunkId: 'chunk-1' } as any;
    const result = await resolver.chunk(evidence);

    expect(result).toEqual({ id: 'chunk-1' });
    expect(load).toHaveBeenCalledWith('chunk-1');
  });

  it('should resolve mentionLinks via DataLoader using evidence id', async () => {
    const load = jest.fn().mockResolvedValue([{ id: 'link-1' }]);
    dataLoaders.getEvidenceMentionLinksByEvidenceLoader.mockReturnValue({
      load,
    } as any);

    const evidence = { id: 'ev-1' } as any;
    const result = await resolver.mentionLinks(evidence);

    expect(result).toEqual([{ id: 'link-1' }]);
    expect(load).toHaveBeenCalledWith('ev-1');
  });
});
