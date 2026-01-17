import { Test } from '@nestjs/testing';
import { DocumentChunkResolver } from './document-chunk.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { DocumentChunk } from '@models/document-chunk.model';
import { Document } from '@models/document.model';
import { Embedding } from '@models/embedding.model';
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
      embedding: {
        findMany: jest.fn(),
      },
      entityMention: {
        findMany: jest.fn(),
      },
    };

    const mockDataLoaderService = {
      getDocumentLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue(null),
      }),
      getEmbeddingsByChunkLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
      getMentionsByChunkLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
      getSuggestionsByChunkLoader: jest.fn().mockReturnValue({
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
      findManyMock.mockResolvedValue(
        mockChunks as unknown as typeof mockChunks,
      );

      const result = await resolver.documentChunks();

      expect(result).toEqual(mockChunks);
      expect(findManyMock).toHaveBeenCalled();
    });

    it('should return empty array when no chunks exist', async () => {
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.documentChunks();

      expect(result).toEqual([]);
    });
  });

  describe('documentChunk', () => {
    it('should return a document chunk by id', async () => {
      const findUniqueMock = prismaService.documentChunk
        .findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(
        mockChunk as unknown as typeof mockChunk,
      );

      const result = await resolver.documentChunk('chunk-1');

      expect(result).toEqual(mockChunk);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 'chunk-1' },
      });
    });

    it('should return null when chunk not found', async () => {
      const findUniqueMock = prismaService.documentChunk
        .findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(null);

      const result = await resolver.documentChunk('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('chunksByDocument', () => {
    it('should return chunks for a specific document', async () => {
      const mockChunks = [mockChunk];
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockChunks as unknown as typeof mockChunks,
      );

      const result = await resolver.chunksByDocument('doc-1');

      expect(result).toEqual(mockChunks);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { documentId: 'doc-1' },
      });
    });

    it('should return empty array when document has no chunks', async () => {
      const findManyMock = prismaService.documentChunk.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.chunksByDocument('doc-2');

      expect(result).toEqual([]);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { documentId: 'doc-2' },
      });
    });
  });

  describe('chunk0ByDocument', () => {
    it('should return chunkIndex=0 for a document', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue(mockChunk as unknown as typeof mockChunk);

      const result = await resolver.chunk0ByDocument('doc-1');

      expect(result).toEqual(mockChunk);
      expect(findFirstMock).toHaveBeenCalledWith({
        where: { documentId: 'doc-1', chunkIndex: 0 },
      });
    });

    it('should return null when chunk0 is not present', async () => {
      const findFirstMock = prismaService.documentChunk.findFirst as jest.Mock;
      findFirstMock.mockResolvedValue(null);

      const result = await resolver.chunk0ByDocument('doc-1');

      expect(result).toBeNull();
    });
  });

  describe('createChunk', () => {
    it('should create a new document chunk', async () => {
      const createMock = prismaService.documentChunk.create as jest.Mock;
      createMock.mockResolvedValue(mockChunk as unknown as typeof mockChunk);

      const result = await resolver.createChunk('doc-1', 0, 'Test content');

      expect(result).toEqual(mockChunk);
      expect(createMock).toHaveBeenCalledWith({
        data: { documentId: 'doc-1', chunkIndex: 0, content: 'Test content' },
      });
    });
  });

  describe('updateChunk', () => {
    it('should update chunk content', async () => {
      const updatedChunk = { ...mockChunk, content: 'Updated content' };
      const updateMock = prismaService.documentChunk.update as jest.Mock;
      updateMock.mockResolvedValue(
        updatedChunk as unknown as typeof updatedChunk,
      );

      const result = await resolver.updateChunk('chunk-1', 'Updated content');

      expect(result).toEqual(updatedChunk);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'chunk-1' },
        data: { content: 'Updated content' },
      });
    });

    it('should handle undefined content', async () => {
      const updateMock = prismaService.documentChunk.update as jest.Mock;
      updateMock.mockResolvedValue(mockChunk as unknown as typeof mockChunk);

      const result = await resolver.updateChunk('chunk-1', undefined);

      expect(result).toEqual(mockChunk);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'chunk-1' },
        data: { content: undefined },
      });
    });
  });

  describe('deleteChunk', () => {
    it('should delete a document chunk', async () => {
      const deleteMock = prismaService.documentChunk.delete as jest.Mock;
      deleteMock.mockResolvedValue(mockChunk as unknown as typeof mockChunk);

      const result = await resolver.deleteChunk('chunk-1');

      expect(result).toEqual(mockChunk);
      expect(deleteMock).toHaveBeenCalledWith({
        where: { id: 'chunk-1' },
      });
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

  describe('embeddings', () => {
    it('should resolve embeddings field', async () => {
      const mockEmbeddings: Embedding[] = [
        {
          id: 'embedding-1',
          values: [0.1, 0.2, 0.3],
          chunk: mockChunk,
        },
      ];
      const loadMock = jest.fn().mockResolvedValue(mockEmbeddings);
      (
        dataLoaderService.getEmbeddingsByChunkLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.embeddings(mockChunk);

      expect(result).toEqual(mockEmbeddings);
      expect(loadMock).toHaveBeenCalledWith(mockChunk.id);
    });

    it('should return empty array when chunk has no embeddings', async () => {
      const loadMock = jest.fn().mockResolvedValue([]);
      (
        dataLoaderService.getEmbeddingsByChunkLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.embeddings(mockChunk);

      expect(result).toEqual([]);
      expect(loadMock).toHaveBeenCalledWith(mockChunk.id);
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

  describe('aiSuggestions', () => {
    it('should resolve aiSuggestions field', async () => {
      const mockSuggestions = [{ id: 's1' }];
      const loadMock = jest.fn().mockResolvedValue(mockSuggestions);
      (
        dataLoaderService.getSuggestionsByChunkLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.aiSuggestions(mockChunk);

      expect(result).toEqual(mockSuggestions);
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
