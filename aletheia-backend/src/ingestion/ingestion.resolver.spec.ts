import { Test } from '@nestjs/testing';
import { IngestionResolver } from './ingestion.resolver';
import { IngestionService } from './ingestion.service';
import { ForbiddenException } from '@nestjs/common';
import { DocumentSourceKindInput } from '../graphql/inputs/document-source.input';
import { DocumentChunkResolver } from '../graphql/resolvers/document-chunk.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { DataLoaderService } from '../common/dataloaders/dataloader.service';

describe('IngestionResolver', () => {
  let resolver: IngestionResolver;
  let service: jest.Mocked<IngestionService>;

  beforeEach(async () => {
    const mockIngestionService = {
      ingest: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestionResolver,
        {
          provide: IngestionService,
          useValue: mockIngestionService,
        },
      ],
    }).compile();

    resolver = moduleRef.get<IngestionResolver>(IngestionResolver);
    service = moduleRef.get(IngestionService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('can be instantiated manually', () => {
    const manualResolver = new IngestionResolver(service);
    expect(manualResolver).toBeDefined();
  });

  describe('DocumentChunk resolver', () => {
    it('should be defined', async () => {
      const module = await Test.createTestingModule({
        providers: [
          DocumentChunkResolver,
          { provide: PrismaService, useValue: {} },
          { provide: DataLoaderService, useValue: {} },
        ],
      }).compile();
      expect(await module.resolve(DocumentChunkResolver)).toBeDefined();
    });
  });

  describe('DataLoader service', () => {
    it('should be defined', async () => {
      const module = await Test.createTestingModule({
        providers: [
          DataLoaderService,
          { provide: PrismaService, useValue: {} },
        ],
      }).compile();
      expect(await module.resolve(DataLoaderService)).toBeDefined();
    });
  });

  describe('ingestDocument', () => {
    const input = {
      title: 'Test Doc',
      userId: 'user-1',
      content: 'Some content',
      source: { kind: DocumentSourceKindInput.MANUAL },
    };

    it('should call ingestion service with correct input', async () => {
      const mockDoc = { id: 'doc-1', title: 'Test Doc' };
      service.ingest.mockResolvedValue(mockDoc as any);

      const result = await resolver.ingestDocument(input as any, {
        req: { user: { sub: 'user-1' } },
      });

      expect(result).toEqual(mockDoc);
      expect(service.ingest).toHaveBeenCalledWith(input);
    });

    it('should allow ingestion if userId matches auth user', async () => {
      const mockDoc = { id: 'doc-1', title: 'Test Doc' };
      service.ingest.mockResolvedValue(mockDoc as any);

      const result = await resolver.ingestDocument(input as any, {
        req: { user: { sub: 'user-1' } },
      });

      expect(result).toEqual(mockDoc);
    });

    it('should throw ForbiddenException if userId does not match auth user', async () => {
      await expect(
        resolver.ingestDocument(input as any, {
          req: { user: { sub: 'user-other' } },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ingestion if no auth user is present in context (e.g. internal call)', async () => {
      const mockDoc = { id: 'doc-1', title: 'Test Doc' };
      service.ingest.mockResolvedValue(mockDoc as any);

      const result = await resolver.ingestDocument(input as any, {});

      expect(result).toEqual(mockDoc);
    });
  });

  describe('ingestionHealthCheck', () => {
    it('should return ok', () => {
      expect(resolver.ingestionHealthCheck()).toBe('ok');
    });
  });
});
