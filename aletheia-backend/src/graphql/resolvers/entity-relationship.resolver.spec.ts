import { Test } from '@nestjs/testing';
import { EntityRelationshipResolver } from './entity-relationship.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { EntityRelationship } from '@models/entity-relationship.model';
import { Entity } from '@models/entity.model';
import {
  CreateEntityRelationshipInput,
  UpdateEntityRelationshipInput,
} from '@inputs/entity-relationship.input';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('EntityRelationshipResolver', () => {
  let resolver: EntityRelationshipResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let dataLoaderService: jest.Mocked<DataLoaderService>;

  const mockFromEntity: Entity = {
    id: 'entity-1',
    name: 'From Entity',
    type: 'Person',
    mentions: [],
    outgoing: [],
    incoming: [],
  };

  const mockToEntity: Entity = {
    id: 'entity-2',
    name: 'To Entity',
    type: 'Person',
    mentions: [],
    outgoing: [],
    incoming: [],
  };

  const mockRelationship: EntityRelationship = {
    id: 'rel-1',
    relation: 'knows',
    from: mockFromEntity,
    to: mockToEntity,
    evidence: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      entityRelationship: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      entity: {
        findUnique: jest.fn(),
      },
    };

    const mockDataLoaderService = {
      getEntityLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue(null),
      }),
    };

    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        EntityRelationshipResolver,
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

    resolver = await moduleRef.resolve<EntityRelationshipResolver>(
      EntityRelationshipResolver,
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

  describe('entityRelationships', () => {
    it('should return an array of entity relationships', async () => {
      const mockRelationships = [mockRelationship];
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue(mockRelationships as any);

      const result = await resolver.entityRelationships();

      expect(result).toEqual(mockRelationships);
      expect(prismaService.entityRelationship.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no relationships exist', async () => {
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue([]);

      const result = await resolver.entityRelationships();

      expect(result).toEqual([]);
    });
  });

  describe('entityRelationship', () => {
    it('should return an entity relationship by id', async () => {
      (
        prismaService.entityRelationship.findUnique as jest.Mock
      ).mockResolvedValue(mockRelationship as any);

      const result = await resolver.entityRelationship('rel-1');

      expect(result).toEqual(mockRelationship);
      expect(prismaService.entityRelationship.findUnique).toHaveBeenCalledWith({
        where: { id: 'rel-1' },
      });
    });

    it('should return null when relationship not found', async () => {
      (
        prismaService.entityRelationship.findUnique as jest.Mock
      ).mockResolvedValue(null);

      const result = await resolver.entityRelationship('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('from', () => {
    it('should resolve from entity field', async () => {
      // Mock relationship with fromEntity from database field
      const relationshipWithFromEntity = {
        ...mockRelationship,
        fromEntity: mockFromEntity.id,
      } as unknown as import('../models/entity-relationship.model').EntityRelationship & {
        fromEntity: string;
      };
      const loadMock = jest.fn().mockResolvedValue(mockFromEntity);
      (dataLoaderService.getEntityLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.from(relationshipWithFromEntity);

      expect(result).toEqual(mockFromEntity);
      expect(loadMock).toHaveBeenCalledWith(mockFromEntity.id);
    });

    it('should handle null entity', async () => {
      // Mock relationship with fromEntity from database field
      const relationshipWithFromEntity = {
        ...mockRelationship,
        fromEntity: 'non-existent',
      } as unknown as import('../models/entity-relationship.model').EntityRelationship & {
        fromEntity: string;
      };
      const loadMock = jest.fn().mockResolvedValue(null);
      (dataLoaderService.getEntityLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.from(relationshipWithFromEntity);

      expect(result).toBeNull();
      expect(loadMock).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('to', () => {
    it('should resolve to entity field', async () => {
      // Mock relationship with toEntity from database field
      const relationshipWithToEntity = {
        ...mockRelationship,
        toEntity: mockToEntity.id,
      } as unknown as import('../models/entity-relationship.model').EntityRelationship & {
        toEntity: string;
      };
      const loadMock = jest.fn().mockResolvedValue(mockToEntity);
      (dataLoaderService.getEntityLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.to(relationshipWithToEntity);

      expect(result).toEqual(mockToEntity);
      expect(loadMock).toHaveBeenCalledWith(mockToEntity.id);
    });

    it('should handle null entity', async () => {
      // Mock relationship with toEntity from database field
      const relationshipWithToEntity = {
        ...mockRelationship,
        toEntity: 'non-existent',
      } as unknown as import('../models/entity-relationship.model').EntityRelationship & {
        toEntity: string;
      };
      const loadMock = jest.fn().mockResolvedValue(null);
      (dataLoaderService.getEntityLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.to(relationshipWithToEntity);

      expect(result).toBeNull();
      expect(loadMock).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('createEntityRelationship', () => {
    it('should create a new entity relationship', async () => {
      const input: CreateEntityRelationshipInput = {
        fromEntity: 'entity-1',
        toEntity: 'entity-2',
        relation: 'knows',
      };
      (prismaService.entityRelationship.create as jest.Mock).mockResolvedValue(
        mockRelationship as any,
      );

      const result = await resolver.createEntityRelationship(input);

      expect(result).toEqual(mockRelationship);
      expect(prismaService.entityRelationship.create).toHaveBeenCalledWith({
        data: input,
      });
    });
  });

  describe('updateEntityRelationship', () => {
    it('should update an entity relationship', async () => {
      const input: UpdateEntityRelationshipInput = {
        id: 'rel-1',
        fromEntity: 'entity-3',
        toEntity: 'entity-4',
        relation: 'works_with',
      };
      const updatedRelationship = { ...mockRelationship, ...input };
      (prismaService.entityRelationship.update as jest.Mock).mockResolvedValue(
        updatedRelationship as any,
      );

      const result = await resolver.updateEntityRelationship(input);

      expect(result).toEqual(updatedRelationship);
      expect(prismaService.entityRelationship.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: {
          fromEntity: input.fromEntity,
          toEntity: input.toEntity,
          relation: input.relation,
        },
      });
    });
  });

  describe('deleteEntityRelationship', () => {
    it('should delete an entity relationship', async () => {
      (prismaService.entityRelationship.delete as jest.Mock).mockResolvedValue(
        mockRelationship as any,
      );

      const result = await resolver.deleteEntityRelationship('rel-1');

      expect(result).toEqual(mockRelationship);
      expect(prismaService.entityRelationship.delete).toHaveBeenCalledWith({
        where: { id: 'rel-1' },
      });
    });
  });

  it('should build GraphQL schema with EntityRelationshipResolver', async () => {
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
        EntityRelationshipResolver,
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

    const entityRelationshipResolver =
      await moduleRef.resolve<EntityRelationshipResolver>(
        EntityRelationshipResolver,
      );
    expect(entityRelationshipResolver).toBeDefined();

    await app.close();
  });
});
