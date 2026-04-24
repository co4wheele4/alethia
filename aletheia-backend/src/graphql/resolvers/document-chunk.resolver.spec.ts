import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentChunkResolver } from './document-chunk.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { DocumentChunk } from '@models/document-chunk.model';
import { Document } from '@models/document.model';
import { EntityMention } from '@models/entity-mention.model';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('DocumentChunkResolver', () => {
  let resolver: DocumentChunkResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let dataLoaderService: jest.Mocked<DataLoaderService>;

  const mockDocument: Document = {
    id: 'doc-1',
    title: 'Test Document',
    user: {} as unknown as Document['user'],
    createdAt: new Date(),
    chunks: [],
  };

  const mockChunk: DocumentChunk = {
    id: 'chunk-1',
    documentId: 'doc-1',
    chunkIndex: 0,
    content: 'Test content',
  };

  const authCtx = {
    req: { user: { sub: 'user-1' } },
  };

  beforeEach(async () => {
    const mockPrismaService = {
      documentChunk: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      document: {
        findUnique: jest.fn(),
      },
      entityMention: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      evidence: {
        count: jest.fn(),
      },
      entityRelationshipEvidence: {
        count: jest.fn(),
      },
      embedding: {
        count: jest.fn(),
      },
    };

    const mockDataLoaderService = {
      getDocumentLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue(null),
      }),
      getMentionsByChunkLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
    };

    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        DocumentChunkResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DataLoaderService,
          useValue: mockDataLoaderService,
        },
      ],
    }).compile();

    resolver = await moduleRef.resolve<DocumentChunkResolver>(
      DocumentChunkResolver,
    );
    prismaService = moduleRef.get(PrismaService);
    dataLoaderService = moduleRef.get(DataLoaderService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should have prisma service injected', () => {
    expect(resolver).toHaveProperty('prisma');
    expect(resolver['prisma']).toBe(prismaService);
  });

  describe('documentChunks', () => {
    it('should return an array of document chunks', async () => {
      const mockChunks = [mockChunk];
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      findManyMock.mockResolvedValue(mockChunks);

      const result = await resolver.documentChunks(authCtx);

      expect(result).toEqual(mockChunks);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { document: { userId: 'user-1' } },
      });
    });

    it('should return empty array when no chunks exist', async () => {
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.documentChunks(authCtx);

      expect(result).toEqual([]);
    });

    it('should return empty list when not authenticated', async () => {
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      const result = await resolver.documentChunks(undefined);
      expect(result).toEqual([]);
      expect(findManyMock).not.toHaveBeenCalled();
    });
  });

  describe('documentChunk', () => {
    it('should return a document chunk by id', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue(mockChunk);

      const result = await resolver.documentChunk('chunk-1', authCtx);

      expect(result).toEqual(mockChunk);
      expect(findFirstMock).toHaveBeenCalledWith({
        where: { id: 'chunk-1', document: { userId: 'user-1' } },
      });
    });

    it('should return null when chunk not found', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue(null);

      const result = await resolver.documentChunk('non-existent', authCtx);

      expect(result).toBeNull();
    });

    it('should return null when not authenticated', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      const result = await resolver.documentChunk('chunk-1', undefined);
      expect(result).toBeNull();
      expect(findFirstMock).not.toHaveBeenCalled();
    });
  });

  describe('chunksByDocument', () => {
    it('should return chunks for a specific document', async () => {
      const mockChunks = [mockChunk];
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      findManyMock.mockResolvedValue(mockChunks);

      const result = await resolver.chunksByDocument('doc-1', authCtx);

      expect(result).toEqual(mockChunks);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { documentId: 'doc-1', document: { userId: 'user-1' } },
      });
    });

    it('should return empty array when document has no chunks', async () => {
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.chunksByDocument('doc-2', authCtx);

      expect(result).toEqual([]);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { documentId: 'doc-2', document: { userId: 'user-1' } },
      });
    });

    it('should return empty list when not authenticated', async () => {
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      const result = await resolver.chunksByDocument('doc-1', undefined);
      expect(result).toEqual([]);
      expect(findManyMock).not.toHaveBeenCalled();
    });
  });

  describe('chunk0ByDocument', () => {
    it('should return chunkIndex=0 for a document', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue(mockChunk);

      const result = await resolver.chunk0ByDocument('doc-1', authCtx);

      expect(result).toEqual(mockChunk);
      expect(findFirstMock).toHaveBeenCalledWith({
        where: {
          documentId: 'doc-1',
          chunkIndex: 0,
          document: { userId: 'user-1' },
        },
      });
    });

    it('should return null when chunk0 is not present', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue(null);

      const result = await resolver.chunk0ByDocument('doc-1', authCtx);

      expect(result).toBeNull();
    });

    it('should return null when not authenticated', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      const result = await resolver.chunk0ByDocument('doc-1', undefined);
      expect(result).toBeNull();
      expect(findFirstMock).not.toHaveBeenCalled();
    });
  });

  describe('createChunk', () => {
    it('should create a new document chunk', async () => {
      (prismaService.document.findUnique as jest.Mock).mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
      });
      const createMock = prismaService.documentChunk.create as jest.Mock;
      createMock.mockResolvedValue(mockChunk);

      const result = await resolver.createChunk(
        'doc-1',
        0,
        'Test content',
        authCtx,
      );

      expect(result).toEqual(mockChunk);
      expect(createMock).toHaveBeenCalledWith({
        data: { documentId: 'doc-1', chunkIndex: 0, content: 'Test content' },
      });
    });

    it('should forbid creating a chunk for another user document', async () => {
      (prismaService.document.findUnique as jest.Mock).mockResolvedValue({
        id: 'doc-1',
        userId: 'user-2',
      });

      await expect(
        resolver.createChunk('doc-1', 0, 'Test content', authCtx),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaService.documentChunk.create).not.toHaveBeenCalled();
    });

    it('should reject create when the request is not authenticated', async () => {
      await expect(
        resolver.createChunk('doc-1', 0, 'c', undefined),
      ).rejects.toMatchObject({ message: 'Authentication required' });
      expect(prismaService.documentChunk.create).not.toHaveBeenCalled();
    });
  });

  describe('updateChunk', () => {
    beforeEach(() => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue(mockChunk);
      (prismaService.evidence.count as jest.Mock).mockResolvedValue(0);
      (prismaService.entityMention.count as jest.Mock).mockResolvedValue(0);
      (
        prismaService.entityRelationshipEvidence.count as jest.Mock
      ).mockResolvedValue(0);
      (prismaService.embedding.count as jest.Mock).mockResolvedValue(0);
    });

    it('should update chunk content when no anchors reference the chunk', async () => {
      const updatedChunk = { ...mockChunk, content: 'Updated content' };
      const updateMock = prismaService.documentChunk.update as jest.Mock;
      updateMock.mockResolvedValue(updatedChunk);

      const result = await resolver.updateChunk(
        'chunk-1',
        'Updated content',
        authCtx,
      );

      expect(result).toEqual(updatedChunk);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'chunk-1' },
        data: { content: 'Updated content' },
      });
    });

    it('should throw NotFoundException when chunk id does not exist', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue(null);

      await expect(
        resolver.updateChunk('missing', 'x', authCtx),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaService.documentChunk.update).not.toHaveBeenCalled();
    });

    it('should reject content change when evidence anchors the chunk', async () => {
      (prismaService.evidence.count as jest.Mock).mockResolvedValue(1);

      await expect(
        resolver.updateChunk('chunk-1', 'Updated content', authCtx),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaService.documentChunk.update).not.toHaveBeenCalled();
    });

    it('should handle undefined content', async () => {
      const updateMock = prismaService.documentChunk.update as jest.Mock;
      updateMock.mockResolvedValue(mockChunk);

      const result = await resolver.updateChunk('chunk-1', undefined, authCtx);

      expect(result).toEqual(mockChunk);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'chunk-1' },
        data: { content: undefined },
      });
    });

    it('should reject update when the request is not authenticated', async () => {
      await expect(
        resolver.updateChunk('chunk-1', 'x', undefined),
      ).rejects.toMatchObject({ message: 'Authentication required' });
      expect(prismaService.documentChunk.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteChunk', () => {
    beforeEach(() => {
      (prismaService.documentChunk.findFirst as jest.Mock).mockResolvedValue(
        mockChunk,
      );
      (prismaService.evidence.count as jest.Mock).mockResolvedValue(0);
      (prismaService.entityMention.count as jest.Mock).mockResolvedValue(0);
      (
        prismaService.entityRelationshipEvidence.count as jest.Mock
      ).mockResolvedValue(0);
      (prismaService.embedding.count as jest.Mock).mockResolvedValue(0);
    });

    it('should delete a document chunk when no anchors reference it', async () => {
      const deleteMock = prismaService.documentChunk.delete as jest.Mock;
      deleteMock.mockResolvedValue(mockChunk);

      const result = await resolver.deleteChunk('chunk-1', authCtx);

      expect(result).toEqual(mockChunk);
      expect(deleteMock).toHaveBeenCalledWith({
        where: { id: 'chunk-1' },
      });
    });

    it('should reject delete when evidence references the chunk', async () => {
      (prismaService.evidence.count as jest.Mock).mockResolvedValue(1);

      await expect(
        resolver.deleteChunk('chunk-1', authCtx),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaService.documentChunk.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when chunk belongs to another user', async () => {
      (prismaService.documentChunk.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        resolver.deleteChunk('chunk-1', authCtx),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaService.documentChunk.delete).not.toHaveBeenCalled();
    });

    it('should reject delete when the request is not authenticated', async () => {
      await expect(
        resolver.deleteChunk('chunk-1', undefined),
      ).rejects.toMatchObject({ message: 'Authentication required' });
      expect(prismaService.documentChunk.delete).not.toHaveBeenCalled();
    });
  });

  describe('document', () => {
    it('should resolve document field', async () => {
      const chunkWithDocumentId =
        mockChunk as unknown as import('../models/document-chunk.model').DocumentChunk & {
          documentId: string;
        };
      const loadMock = jest.fn().mockResolvedValue(mockDocument);
      (dataLoaderService.getDocumentLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.document(chunkWithDocumentId);

      expect(result).toEqual(mockDocument);
      expect(loadMock).toHaveBeenCalledWith(mockChunk.documentId);
    });

    it('should handle null document', async () => {
      const chunkWithNullDocument = {
        ...mockChunk,
        documentId: 'non-existent',
      } as unknown as import('../models/document-chunk.model').DocumentChunk & {
        documentId: string;
      };
      const loadMock = jest.fn().mockResolvedValue(null);
      (dataLoaderService.getDocumentLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.document(chunkWithNullDocument);

      expect(result).toBeNull();
      expect(loadMock).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('mentions', () => {
    it('should resolve mentions field', async () => {
      const mockMentions: EntityMention[] = [
        {
          id: 'mention-1',
          entityId: 'entity-1',
          chunkId: mockChunk.id,
          startOffset: null,
          endOffset: null,
          excerpt: null,
          entity: {} as unknown as EntityMention['entity'],
          chunk: mockChunk,
        },
      ];
      const loadMock = jest.fn().mockResolvedValue(mockMentions);
      (dataLoaderService.getMentionsByChunkLoader as jest.Mock).mockReturnValue(
        {
          load: loadMock,
        },
      );

      const result = await resolver.mentions(mockChunk);

      expect(result).toEqual(mockMentions);
      expect(loadMock).toHaveBeenCalledWith(mockChunk.id);
    });

    it('should return empty array when chunk has no mentions', async () => {
      const loadMock = jest.fn().mockResolvedValue([]);
      (dataLoaderService.getMentionsByChunkLoader as jest.Mock).mockReturnValue(
        {
          load: loadMock,
        },
      );

      const result = await resolver.mentions(mockChunk);

      expect(result).toEqual([]);
      expect(loadMock).toHaveBeenCalledWith(mockChunk.id);
    });
  });

  it('should build GraphQL schema with DocumentChunkResolver', async () => {
    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        DocumentChunkResolver,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: DataLoaderService,
          useValue: dataLoaderService,
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const documentChunkResolver =
      await moduleRef.resolve<DocumentChunkResolver>(DocumentChunkResolver);
    expect(documentChunkResolver).toBeDefined();

    await app.close();
  });
});
