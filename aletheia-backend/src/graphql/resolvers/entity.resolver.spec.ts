import { Test } from '@nestjs/testing';
import { EntityResolver } from './entity.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { Entity } from '@models/entity.model';
import { EntityMention } from '@models/entity-mention.model';
import { EntityRelationship } from '@models/entity-relationship.model';
import { CreateEntityInput, UpdateEntityInput } from '@inputs/entity.input';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('EntityResolver', () => {
  let resolver: EntityResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let dataLoaderService: jest.Mocked<DataLoaderService>;

  const mockEntity: Entity = {
    id: 'entity-1',
    name: 'Test Entity',
    type: 'Person',
    mentions: [],
    outgoing: [],
    incoming: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      entity: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      entityMention: {
        findMany: jest.fn(),
      },
      entityRelationship: {
        findMany: jest.fn(),
      },
    };

    const mockDataLoaderService = {
      getMentionsByEntityLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
      getRelationshipsByFromEntityLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
      getRelationshipsByToEntityLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
    };

    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        EntityResolver,
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

    resolver = await moduleRef.resolve<EntityResolver>(EntityResolver);
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

  describe('entities', () => {
    it('should return an array of entities', async () => {
      const mockEntities = [mockEntity];
      (prismaService.entity.findMany as jest.Mock).mockResolvedValue(
        mockEntities as any,
      );

      const result = await resolver.entities();

      expect(result).toEqual(mockEntities);
      expect(prismaService.entity.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no entities exist', async () => {
      (prismaService.entity.findMany as jest.Mock).mockResolvedValue([]);

      const result = await resolver.entities();

      expect(result).toEqual([]);
    });
  });

  describe('entity', () => {
    it('should return an entity by id', async () => {
      (prismaService.entity.findUnique as jest.Mock).mockResolvedValue(
        mockEntity as any,
      );

      const result = await resolver.entity('entity-1');

      expect(result).toEqual(mockEntity);
      expect(prismaService.entity.findUnique).toHaveBeenCalledWith({
        where: { id: 'entity-1' },
      });
    });

    it('should return null when entity not found', async () => {
      (prismaService.entity.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await resolver.entity('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('mentions', () => {
    it('should resolve mentions field', async () => {
      const mockMentions: EntityMention[] = [
        {
          id: 'mention-1',
          entity: mockEntity,
          chunk:
            {} as unknown as import('../models/document-chunk.model').DocumentChunk,
        },
      ];
      const loadMock = jest.fn().mockResolvedValue(mockMentions);
      (
        dataLoaderService.getMentionsByEntityLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.mentions(mockEntity);

      expect(result).toEqual(mockMentions);
      expect(loadMock).toHaveBeenCalledWith(mockEntity.id);
    });

    it('should return empty array when entity has no mentions', async () => {
      const loadMock = jest.fn().mockResolvedValue([]);
      (
        dataLoaderService.getMentionsByEntityLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.mentions(mockEntity);

      expect(result).toEqual([]);
      expect(loadMock).toHaveBeenCalledWith(mockEntity.id);
    });
  });

  describe('outgoing', () => {
    it('should resolve outgoing relationships', async () => {
      const mockRelationships: EntityRelationship[] = [
        {
          id: 'rel-1',
          relation: 'knows',
          from: mockEntity,
          to: {} as Entity,
          evidence: [],
        },
      ];
      const loadMock = jest.fn().mockResolvedValue(mockRelationships);
      (
        dataLoaderService.getRelationshipsByFromEntityLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.outgoing(mockEntity);

      expect(result).toEqual(mockRelationships);
      expect(loadMock).toHaveBeenCalledWith(mockEntity.id);
    });

    it('should return empty array when entity has no outgoing relationships', async () => {
      const loadMock = jest.fn().mockResolvedValue([]);
      (
        dataLoaderService.getRelationshipsByFromEntityLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.outgoing(mockEntity);

      expect(result).toEqual([]);
      expect(loadMock).toHaveBeenCalledWith(mockEntity.id);
    });
  });

  describe('incoming', () => {
    it('should resolve incoming relationships', async () => {
      const mockRelationships: EntityRelationship[] = [
        {
          id: 'rel-1',
          relation: 'known_by',
          from: {} as Entity,
          to: mockEntity,
          evidence: [],
        },
      ];
      const loadMock = jest.fn().mockResolvedValue(mockRelationships);
      (
        dataLoaderService.getRelationshipsByToEntityLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.incoming(mockEntity);

      expect(result).toEqual(mockRelationships);
      expect(loadMock).toHaveBeenCalledWith(mockEntity.id);
    });

    it('should return empty array when entity has no incoming relationships', async () => {
      const loadMock = jest.fn().mockResolvedValue([]);
      (
        dataLoaderService.getRelationshipsByToEntityLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.incoming(mockEntity);

      expect(result).toEqual([]);
      expect(loadMock).toHaveBeenCalledWith(mockEntity.id);
    });
  });

  describe('createEntity', () => {
    it('should create a new entity', async () => {
      const input: CreateEntityInput = {
        name: 'New Entity',
        type: 'Organization',
      };
      const newEntity = { ...mockEntity, ...input };
      (prismaService.entity.create as jest.Mock).mockResolvedValue(
        newEntity as any,
      );

      const result = await resolver.createEntity(input);

      expect(result).toEqual(newEntity);
      expect(prismaService.entity.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('updateEntity', () => {
    it('should update an entity', async () => {
      const input: UpdateEntityInput = {
        id: 'entity-1',
        name: 'Updated Entity',
        type: 'UpdatedType',
      };
      const updatedEntity = { ...mockEntity, ...input };
      (prismaService.entity.update as jest.Mock).mockResolvedValue(
        updatedEntity as any,
      );

      const result = await resolver.updateEntity(input);

      expect(result).toEqual(updatedEntity);
      expect(prismaService.entity.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: { name: input.name, type: input.type },
      });
    });
  });

  describe('deleteEntity', () => {
    it('should delete an entity', async () => {
      (prismaService.entity.delete as jest.Mock).mockResolvedValue(
        mockEntity as any,
      );

      const result = await resolver.deleteEntity('entity-1');

      expect(result).toEqual(mockEntity);
      expect(prismaService.entity.delete).toHaveBeenCalledWith({
        where: { id: 'entity-1' },
      });
    });
  });

  it('should build GraphQL schema with EntityResolver', async () => {
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
        EntityResolver,
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

    const entityResolver =
      await moduleRef.resolve<EntityResolver>(EntityResolver);
    expect(entityResolver).toBeDefined();

    await app.close();
  });
});
