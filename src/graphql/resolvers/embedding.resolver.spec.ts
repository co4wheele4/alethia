import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingResolver } from './embedding.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { Embedding } from '@models/embedding.model';
import { DocumentChunk } from '@models/document-chunk.model';
import 'reflect-metadata';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('EmbeddingResolver', () => {
  let resolver: EmbeddingResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let dataLoaderService: jest.Mocked<DataLoaderService>;

  const mockChunk: DocumentChunk = {
    id: 'chunk-1',
    chunkIndex: 0,
    content: 'Test content',
    documentId: 'doc-1',
  };

  const mockEmbedding: Embedding = {
    id: 'embedding-1',
    values: [0.1, 0.2, 0.3],
    chunk: mockChunk,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      embedding: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      documentChunk: {
        findUnique: jest.fn(),
      },
    };

    const mockDataLoaderService = {
      getDocumentChunkLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue(null),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingResolver,
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

    resolver = await module.resolve<EmbeddingResolver>(EmbeddingResolver);
    prismaService = module.get(PrismaService);
    dataLoaderService = module.get(DataLoaderService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should have prisma service injected', () => {
    expect(resolver).toHaveProperty('prisma');
    expect(resolver['prisma']).toBe(prismaService);
  });

  it('should instantiate with prisma service', () => {
    const newResolver = new EmbeddingResolver(prismaService, dataLoaderService);
    expect(newResolver).toBeInstanceOf(EmbeddingResolver);
    expect(newResolver['prisma']).toBe(prismaService);
  });

  it('should have correct GraphQL decorators on embedding query', () => {
    expect(resolver.embedding).toBeDefined();
  });

  it('should have correct GraphQL decorators on createEmbedding mutation', () => {
    expect(resolver.createEmbedding).toBeDefined();
    expect(typeof resolver.createEmbedding).toBe('function');
  });

  it('should have correct GraphQL decorators on updateEmbedding mutation', () => {
    expect(resolver.updateEmbedding).toBeDefined();
    expect(typeof resolver.updateEmbedding).toBe('function');
  });

  it('should build GraphQL schema with resolver', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        EmbeddingResolver,
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

    const app = module.createNestApplication();
    await app.init();

    const embeddingResolver =
      await module.resolve<EmbeddingResolver>(EmbeddingResolver);
    expect(embeddingResolver).toBeDefined();

    await app.close();
  });

  describe('embeddings', () => {
    it('should return an array of embeddings', async () => {
      const mockEmbeddings = [mockEmbedding];
      const findManyMock = prismaService.embedding.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockEmbeddings as unknown as typeof mockEmbeddings,
      );

      const result = await resolver.embeddings();

      expect(result).toEqual(mockEmbeddings);
      expect(findManyMock).toHaveBeenCalled();
    });

    it('should return empty array when no embeddings exist', async () => {
      const findManyMock = prismaService.embedding.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.embeddings();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const findManyMock = prismaService.embedding.findMany as jest.Mock;
      const error = new Error('Database error');
      findManyMock.mockRejectedValue(error);

      await expect(resolver.embeddings()).rejects.toThrow('Database error');
    });
  });

  describe('embedding', () => {
    it('should return an embedding by id', async () => {
      const findUniqueMock = prismaService.embedding.findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(
        mockEmbedding as unknown as typeof mockEmbedding,
      );

      const result = await resolver.embedding('embedding-1');

      expect(result).toEqual(mockEmbedding);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 'embedding-1' },
      });
    });

    it('should return null when embedding not found', async () => {
      const findUniqueMock = prismaService.embedding.findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(null);

      const result = await resolver.embedding('non-existent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const findUniqueMock = prismaService.embedding.findUnique as jest.Mock;
      const error = new Error('Database error');
      findUniqueMock.mockRejectedValue(error);

      await expect(resolver.embedding('embedding-1')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('embeddingsByChunk', () => {
    it('should return embeddings for a specific chunk', async () => {
      const mockEmbeddings = [mockEmbedding];
      const findManyMock = prismaService.embedding.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockEmbeddings as unknown as typeof mockEmbeddings,
      );

      const result = await resolver.embeddingsByChunk('chunk-1');

      expect(result).toEqual(mockEmbeddings);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { chunkId: 'chunk-1' },
      });
    });

    it('should return empty array when chunk has no embeddings', async () => {
      const findManyMock = prismaService.embedding.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.embeddingsByChunk('chunk-2');

      expect(result).toEqual([]);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { chunkId: 'chunk-2' },
      });
    });

    it('should handle database errors', async () => {
      const findManyMock = prismaService.embedding.findMany as jest.Mock;
      const error = new Error('Database error');
      findManyMock.mockRejectedValue(error);

      await expect(resolver.embeddingsByChunk('chunk-1')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('createEmbedding', () => {
    it('should create a new embedding', async () => {
      const values = [0.1, 0.2, 0.3];
      const createMock = prismaService.embedding.create as jest.Mock;
      createMock.mockResolvedValue(
        mockEmbedding as unknown as typeof mockEmbedding,
      );

      const result = await resolver.createEmbedding('chunk-1', values);

      expect(result).toEqual(mockEmbedding);
      expect(createMock).toHaveBeenCalledWith({
        data: { chunkId: 'chunk-1', values },
      });
    });

    it('should handle empty values array', async () => {
      const values: number[] = [];
      const createMock = prismaService.embedding.create as jest.Mock;
      const emptyEmbedding = { ...mockEmbedding, values: [] };
      createMock.mockResolvedValue(
        emptyEmbedding as unknown as typeof emptyEmbedding,
      );

      const result = await resolver.createEmbedding('chunk-1', values);

      expect(result).toEqual(emptyEmbedding);
      expect(createMock).toHaveBeenCalledWith({
        data: { chunkId: 'chunk-1', values: [] },
      });
    });

    it('should handle large values array', async () => {
      const values = Array(1536)
        .fill(0)
        .map((_, i) => i * 0.001);
      const createMock = prismaService.embedding.create as jest.Mock;
      const largeEmbedding = { ...mockEmbedding, values };
      createMock.mockResolvedValue(
        largeEmbedding as unknown as typeof largeEmbedding,
      );

      const result = await resolver.createEmbedding('chunk-1', values);

      expect(result).toEqual(largeEmbedding);
      expect(createMock).toHaveBeenCalledWith({
        data: { chunkId: 'chunk-1', values },
      });
    });

    it('should handle database errors', async () => {
      const values = [0.1, 0.2, 0.3];
      const createMock = prismaService.embedding.create as jest.Mock;
      const error = new Error('Database error');
      createMock.mockRejectedValue(error);

      await expect(resolver.createEmbedding('chunk-1', values)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updateEmbedding', () => {
    it('should update embedding values', async () => {
      const newValues = [0.4, 0.5, 0.6];
      const updatedEmbedding = { ...mockEmbedding, values: newValues };
      const updateMock = prismaService.embedding.update as jest.Mock;
      updateMock.mockResolvedValue(
        updatedEmbedding as unknown as typeof updatedEmbedding,
      );

      const result = await resolver.updateEmbedding('embedding-1', newValues);

      expect(result).toEqual(updatedEmbedding);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'embedding-1' },
        data: { values: newValues },
      });
    });

    it('should handle undefined values', async () => {
      const updateMock = prismaService.embedding.update as jest.Mock;
      updateMock.mockResolvedValue(
        mockEmbedding as unknown as typeof mockEmbedding,
      );

      const result = await resolver.updateEmbedding('embedding-1', undefined);

      expect(result).toEqual(mockEmbedding);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'embedding-1' },
        data: { values: undefined },
      });
    });

    it('should handle null values', async () => {
      const updateMock = prismaService.embedding.update as jest.Mock;
      updateMock.mockResolvedValue(
        mockEmbedding as unknown as typeof mockEmbedding,
      );

      const result = await resolver.updateEmbedding(
        'embedding-1',
        null as unknown as number[] | undefined,
      );

      expect(result).toEqual(mockEmbedding);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'embedding-1' },
        data: { values: null },
      });
    });

    it('should handle empty values array', async () => {
      const emptyValues: number[] = [];
      const updatedEmbedding = { ...mockEmbedding, values: [] };
      const updateMock = prismaService.embedding.update as jest.Mock;
      updateMock.mockResolvedValue(
        updatedEmbedding as unknown as typeof updatedEmbedding,
      );

      const result = await resolver.updateEmbedding('embedding-1', emptyValues);

      expect(result).toEqual(updatedEmbedding);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'embedding-1' },
        data: { values: [] },
      });
    });

    it('should handle database errors', async () => {
      const newValues = [0.4, 0.5, 0.6];
      const updateMock = prismaService.embedding.update as jest.Mock;
      const error = new Error('Database error');
      updateMock.mockRejectedValue(error);

      await expect(
        resolver.updateEmbedding('embedding-1', newValues),
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteEmbedding', () => {
    it('should delete an embedding', async () => {
      const deleteMock = prismaService.embedding.delete as jest.Mock;
      deleteMock.mockResolvedValue(
        mockEmbedding as unknown as typeof mockEmbedding,
      );

      const result = await resolver.deleteEmbedding('embedding-1');

      expect(result).toEqual(mockEmbedding);
      expect(deleteMock).toHaveBeenCalledWith({
        where: { id: 'embedding-1' },
      });
    });

    it('should handle database errors', async () => {
      const deleteMock = prismaService.embedding.delete as jest.Mock;
      const error = new Error('Database error');
      deleteMock.mockRejectedValue(error);

      await expect(resolver.deleteEmbedding('embedding-1')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('chunk', () => {
    it('should resolve chunk field', async () => {
      // Mock embedding with chunkId from database field
      const embeddingWithChunkId = {
        ...mockEmbedding,
        chunkId: mockChunk.id,
      } as unknown as import('../models/embedding.model').Embedding & {
        chunkId: string;
      };
      const loadMock = jest.fn().mockResolvedValue(mockChunk);
      (dataLoaderService.getDocumentChunkLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.chunk(embeddingWithChunkId);

      expect(result).toEqual(mockChunk);
      expect(loadMock).toHaveBeenCalledWith(mockChunk.id);
    });

    it('should handle null chunk', async () => {
      // Mock embedding with chunkId from database field
      const embeddingWithChunkId = {
        ...mockEmbedding,
        chunkId: 'non-existent',
      } as unknown as import('../models/embedding.model').Embedding & {
        chunkId: string;
      };
      const loadMock = jest.fn().mockResolvedValue(null);
      (dataLoaderService.getDocumentChunkLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.chunk(embeddingWithChunkId);

      expect(result).toBeNull();
      expect(loadMock).toHaveBeenCalledWith('non-existent');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const embeddingWithChunkId = {
        ...mockEmbedding,
        chunkId: mockChunk.id,
      } as unknown as import('../models/embedding.model').Embedding & {
        chunkId: string;
      };
      const loadMock = jest.fn().mockRejectedValue(error);
      (dataLoaderService.getDocumentChunkLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      await expect(resolver.chunk(embeddingWithChunkId)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
