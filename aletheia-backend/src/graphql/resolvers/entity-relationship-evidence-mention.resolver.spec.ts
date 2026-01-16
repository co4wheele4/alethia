import { EntityRelationshipEvidenceMentionResolver } from './entity-relationship-evidence-mention.resolver';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('EntityRelationshipEvidenceMentionResolver', () => {
  let resolver: EntityRelationshipEvidenceMentionResolver;
  let dataLoaders: jest.Mocked<DataLoaderService>;

  beforeEach(() => {
    dataLoaders = {
      getEntityMentionLoader: jest.fn(),
    } as unknown as jest.Mocked<DataLoaderService>;

    resolver = new EntityRelationshipEvidenceMentionResolver(dataLoaders);
  });

  it('should resolve mention via DataLoader using mentionId', async () => {
    const load = jest.fn().mockResolvedValue({ id: 'mention-1' });
    dataLoaders.getEntityMentionLoader.mockReturnValue({ load } as any);

    const link = { mentionId: 'mention-1' } as any;
    const result = await resolver.mention(link);

    expect(result).toEqual({ id: 'mention-1' });
    expect(load).toHaveBeenCalledWith('mention-1');
  });
});
