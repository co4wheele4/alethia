import { Test } from '@nestjs/testing';
import { EntityMentionResolver } from './entity-mention.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { EntityMention } from '@models/entity-mention.model';
import { Entity } from '@models/entity.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { BadRequestException } from '@nestjs/common';
import {
  CreateEntityMentionInput,
  UpdateEntityMentionInput,
} from '@inputs/entity-mention.input';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('EntityMentionResolver', () => {
  let resolver: EntityMentionResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let dataLoaderService: jest.Mocked<DataLoaderService>;

  const mockEntity: Entity = {
    id: 'entity-1',
    name: 'Test Entity',
    type: 'Person',
    mentionCount: 0,
    mentions: [],
    outgoing: [],
    incoming: [],
  };

  const mockChunk: DocumentChunk = {
    id: 'chunk-1',
    chunkIndex: 0,
    content: 'Test content',
    documentId: 'doc-1',
  };

  const mockEntityMention: EntityMention = {
    id: 'mention-1',
    entityId: mockEntity.id,
    chunkId: mockChunk.id,
    startOffset: null,
    endOffset: null,
    excerpt: null,
    entity: mockEntity,
    chunk: mockChunk,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      entityMention: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      entity: {
        findUnique: jest.fn(),
      },
      documentChunk: {
        findUnique: jest.fn(),
      },
    };

    const mockDataLoaderService = {
      getEntityLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue(null),
      }),
      getDocumentChunkLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue(null),
      }),
    };

    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        EntityMentionResolver,
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

    resolver = await moduleRef.resolve<EntityMentionResolver>(
      EntityMentionResolver,
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

  describe('entityMentions', () => {
    it('should return an array of entity mentions', async () => {
      const mockMentions = [mockEntityMention];
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue(
        mockMentions as any,
      );

      const result = await resolver.entityMentions();

      expect(result).toEqual(mockMentions);
      expect(prismaService.entityMention.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no mentions exist', async () => {
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue([]);

      const result = await resolver.entityMentions();

      expect(result).toEqual([]);
    });
  });

  describe('entityMention', () => {
    it('should return an entity mention by id', async () => {
      (prismaService.entityMention.findUnique as jest.Mock).mockResolvedValue(
        mockEntityMention as any,
      );

      const result = await resolver.entityMention('mention-1');

      expect(result).toEqual(mockEntityMention);
      expect(prismaService.entityMention.findUnique).toHaveBeenCalledWith({
        where: { id: 'mention-1' },
      });
    });

    it('should return null when mention not found', async () => {
      (prismaService.entityMention.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await resolver.entityMention('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('entity', () => {
    it('should resolve entity field', async () => {
      // Mock mention with entityId from database field
      const mentionWithEntityId = {
        ...mockEntityMention,
        entityId: mockEntity.id,
      } as unknown as import('../models/entity-mention.model').EntityMention & {
        entityId: string;
      };
      const loadMock = jest.fn().mockResolvedValue(mockEntity);
      (dataLoaderService.getEntityLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.entity(mentionWithEntityId);

      expect(result).toEqual(mockEntity);
      expect(loadMock).toHaveBeenCalledWith(mockEntity.id);
    });

    it('should handle null entity', async () => {
      // Mock mention with entityId from database field
      const mentionWithEntityId = {
        ...mockEntityMention,
        entityId: 'non-existent',
      } as unknown as import('../models/entity-mention.model').EntityMention & {
        entityId: string;
      };
      const loadMock = jest.fn().mockResolvedValue(null);
      (dataLoaderService.getEntityLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.entity(mentionWithEntityId);

      expect(result).toBeNull();
      expect(loadMock).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('chunk', () => {
    it('should resolve chunk field', async () => {
      // Mock mention with chunkId from database field
      const mentionWithChunkId = {
        ...mockEntityMention,
        chunkId: mockChunk.id,
      } as unknown as import('../models/entity-mention.model').EntityMention & {
        chunkId: string;
      };
      const loadMock = jest.fn().mockResolvedValue(mockChunk);
      (dataLoaderService.getDocumentChunkLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.chunk(mentionWithChunkId);

      expect(result).toEqual(mockChunk);
      expect(loadMock).toHaveBeenCalledWith(mockChunk.id);
    });

    it('should handle null chunk', async () => {
      // Mock mention with chunkId from database field
      const mentionWithChunkId = {
        ...mockEntityMention,
        chunkId: 'non-existent',
      } as unknown as import('../models/entity-mention.model').EntityMention & {
        chunkId: string;
      };
      const loadMock = jest.fn().mockResolvedValue(null);
      (dataLoaderService.getDocumentChunkLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.chunk(mentionWithChunkId);

      expect(result).toBeNull();
      expect(loadMock).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('createEntityMention', () => {
    it('should create a new entity mention', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
      };
      (prismaService.entityMention.create as jest.Mock).mockResolvedValue(
        mockEntityMention as any,
      );

      const result = await resolver.createEntityMention(input);

      expect(result).toEqual(mockEntityMention);
      expect(prismaService.entityMention.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it('should require startOffset and endOffset together', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
        startOffset: 0,
      };

      await expect(resolver.createEntityMention(input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(resolver.createEntityMention(input)).rejects.toThrow(
        'startOffset and endOffset must be provided together',
      );
    });

    it('should forbid excerpt without offsets', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
        excerpt: 'hello',
      };

      await expect(resolver.createEntityMention(input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(resolver.createEntityMention(input)).rejects.toThrow(
        'excerpt requires startOffset/endOffset',
      );
    });

    it('should require endOffset > startOffset', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
        startOffset: 5,
        endOffset: 5,
      };

      await expect(resolver.createEntityMention(input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(resolver.createEntityMention(input)).rejects.toThrow(
        'endOffset must be greater than startOffset',
      );
    });

    it('should error when chunk not found for span validation', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-missing',
        startOffset: 0,
        endOffset: 1,
      };
      (prismaService.documentChunk.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(resolver.createEntityMention(input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(resolver.createEntityMention(input)).rejects.toThrow(
        'Chunk not found',
      );
    });

    it('should error when offsets are out of bounds', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
        startOffset: 0,
        endOffset: 999,
      };
      (prismaService.documentChunk.findUnique as jest.Mock).mockResolvedValue({
        content: 'short',
      });

      await expect(resolver.createEntityMention(input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(resolver.createEntityMention(input)).rejects.toThrow(
        'Span offsets are out of bounds',
      );
    });

    it('should treat null chunk content as empty string for bounds checks', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
        startOffset: 0,
        endOffset: 1,
      };
      (prismaService.documentChunk.findUnique as jest.Mock).mockResolvedValue({
        content: null,
      });

      await expect(resolver.createEntityMention(input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(resolver.createEntityMention(input)).rejects.toThrow(
        'Span offsets are out of bounds',
      );
    });

    it('should error when provided excerpt does not match chunk content', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
        startOffset: 0,
        endOffset: 5,
        excerpt: 'WRONG',
      };
      (prismaService.documentChunk.findUnique as jest.Mock).mockResolvedValue({
        content: 'hello world',
      });

      await expect(resolver.createEntityMention(input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(resolver.createEntityMention(input)).rejects.toThrow(
        'excerpt does not match the chunk content',
      );
    });

    it('should fill excerpt from chunk content when offsets are provided', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
        startOffset: 0,
        endOffset: 5,
      };
      (prismaService.documentChunk.findUnique as jest.Mock).mockResolvedValue({
        content: 'hello world',
      });
      (prismaService.entityMention.create as jest.Mock).mockResolvedValue(
        mockEntityMention as any,
      );

      await resolver.createEntityMention(input);

      expect(prismaService.entityMention.create).toHaveBeenCalledWith({
        data: {
          entityId: 'entity-1',
          chunkId: 'chunk-1',
          startOffset: 0,
          endOffset: 5,
          excerpt: 'hello',
        },
      });
    });

    it('should allow excerpt when it matches the chunk content at offsets', async () => {
      const input: CreateEntityMentionInput = {
        entityId: 'entity-1',
        chunkId: 'chunk-1',
        startOffset: 6,
        endOffset: 11,
        excerpt: 'world',
      };
      (prismaService.documentChunk.findUnique as jest.Mock).mockResolvedValue({
        content: 'hello world',
      });
      (prismaService.entityMention.create as jest.Mock).mockResolvedValue(
        mockEntityMention as any,
      );

      await resolver.createEntityMention(input);

      expect(prismaService.entityMention.create).toHaveBeenCalledWith({
        data: {
          entityId: 'entity-1',
          chunkId: 'chunk-1',
          startOffset: 6,
          endOffset: 11,
          excerpt: 'world',
        },
      });
    });
  });

  describe('updateEntityMention', () => {
    it('should update an entity mention', async () => {
      const input: UpdateEntityMentionInput = {
        id: 'mention-1',
        entityId: 'entity-2',
        chunkId: 'chunk-2',
      };
      const updatedMention = { ...mockEntityMention, ...input };
      (prismaService.entityMention.update as jest.Mock).mockResolvedValue(
        updatedMention as any,
      );

      const result = await resolver.updateEntityMention(input);

      expect(result).toEqual(updatedMention);
      expect(prismaService.entityMention.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: { entityId: input.entityId, chunkId: input.chunkId },
      });
    });
  });

  describe('deleteEntityMention', () => {
    it('should delete an entity mention', async () => {
      (prismaService.entityMention.delete as jest.Mock).mockResolvedValue(
        mockEntityMention as any,
      );

      const result = await resolver.deleteEntityMention('mention-1');

      expect(result).toEqual(mockEntityMention);
      expect(prismaService.entityMention.delete).toHaveBeenCalledWith({
        where: { id: 'mention-1' },
      });
    });
  });

  it('should build GraphQL schema with EntityMentionResolver', async () => {
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
        EntityMentionResolver,
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

    const entityMentionResolver =
      await moduleRef.resolve<EntityMentionResolver>(EntityMentionResolver);
    expect(entityMentionResolver).toBeDefined();

    await app.close();
  });
});
