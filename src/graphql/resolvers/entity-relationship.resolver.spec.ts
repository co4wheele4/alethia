import { Test, TestingModule } from '@nestjs/testing';
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

describe('EntityRelationshipResolver', () => {
  let resolver: EntityRelationshipResolver;
  let prismaService: jest.Mocked<PrismaService>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityRelationshipResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<EntityRelationshipResolver>(
      EntityRelationshipResolver,
    );
    prismaService = module.get(PrismaService);
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
      (prismaService.entityRelationship.findMany as jest.Mock).mockResolvedValue(
        mockRelationships as any,
      );

      const result = await resolver.entityRelationships();

      expect(result).toEqual(mockRelationships);
      expect(prismaService.entityRelationship.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no relationships exist', async () => {
      (prismaService.entityRelationship.findMany as jest.Mock).mockResolvedValue([]);

      const result = await resolver.entityRelationships();

      expect(result).toEqual([]);
    });
  });

  describe('entityRelationship', () => {
    it('should return an entity relationship by id', async () => {
      (prismaService.entityRelationship.findUnique as jest.Mock).mockResolvedValue(
        mockRelationship as any,
      );

      const result = await resolver.entityRelationship('rel-1');

      expect(result).toEqual(mockRelationship);
      expect(prismaService.entityRelationship.findUnique).toHaveBeenCalledWith({
        where: { id: 'rel-1' },
      });
    });

    it('should return null when relationship not found', async () => {
      (prismaService.entityRelationship.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await resolver.entityRelationship('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('from', () => {
    it('should resolve from entity field', async () => {
      (prismaService.entity.findUnique as jest.Mock).mockResolvedValue(mockFromEntity as any);

      // Mock relationship with fromEntity from database field
      const relationshipWithFromEntity = { ...mockRelationship, fromEntity: mockFromEntity.id } as any;
      const result = await resolver.from(relationshipWithFromEntity);

      expect(result).toEqual(mockFromEntity);
      expect(prismaService.entity.findUnique).toHaveBeenCalledWith({
        where: { id: mockFromEntity.id },
      });
    });

    it('should handle null entity', async () => {
      (prismaService.entity.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock relationship with fromEntity from database field
      const relationshipWithFromEntity = { ...mockRelationship, fromEntity: 'non-existent' } as any;
      const result = await resolver.from(relationshipWithFromEntity);

      expect(result).toBeNull();
      expect(prismaService.entity.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
    });
  });

  describe('to', () => {
    it('should resolve to entity field', async () => {
      (prismaService.entity.findUnique as jest.Mock).mockResolvedValue(mockToEntity as any);

      // Mock relationship with toEntity from database field
      const relationshipWithToEntity = { ...mockRelationship, toEntity: mockToEntity.id } as any;
      const result = await resolver.to(relationshipWithToEntity);

      expect(result).toEqual(mockToEntity);
      expect(prismaService.entity.findUnique).toHaveBeenCalledWith({
        where: { id: mockToEntity.id },
      });
    });

    it('should handle null entity', async () => {
      (prismaService.entity.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock relationship with toEntity from database field
      const relationshipWithToEntity = { ...mockRelationship, toEntity: 'non-existent' } as any;
      const result = await resolver.to(relationshipWithToEntity);

      expect(result).toBeNull();
      expect(prismaService.entity.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
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
    const module: TestingModule = await Test.createTestingModule({
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
      ],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const entityRelationshipResolver = module.get<EntityRelationshipResolver>(EntityRelationshipResolver);
    expect(entityRelationshipResolver).toBeDefined();

    await app.close();
  });
});
