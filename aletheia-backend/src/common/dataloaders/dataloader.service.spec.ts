import { Test } from '@nestjs/testing';
import { DataLoaderService } from './dataloader.service';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@models/user.model';
import { Lesson } from '@models/lesson.model';
import { Document } from '@models/document.model';
import { DocumentSource } from '@models/document-source.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { Entity } from '@models/entity.model';
import { EntityMention } from '@models/entity-mention.model';
import { EntityRelationship } from '@models/entity-relationship.model';
import { EntityRelationshipEvidence } from '@models/entity-relationship-evidence.model';
import { EntityRelationshipEvidenceMention } from '@models/entity-relationship-evidence-mention.model';

describe('DataLoaderService', () => {
  let service: DataLoaderService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
    },
    lesson: {
      findMany: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
    },
    documentSource: {
      findMany: jest.fn(),
    },
    documentChunk: {
      findMany: jest.fn(),
    },
    entity: {
      findMany: jest.fn(),
    },
    entityMention: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    entityRelationship: {
      findMany: jest.fn(),
    },
    entityRelationshipEvidence: {
      findMany: jest.fn(),
    },
    entityRelationshipEvidenceMention: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        DataLoaderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = await moduleRef.resolve<DataLoaderService>(DataLoaderService);
    prismaService = moduleRef.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getUserLoader();
      expect(loader).toBeDefined();
    });

    it('should load a single user', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        lessons: [],
        documents: [],
      };
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const loader = service.getUserLoader();
      const result = await loader.load('user-1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1'] } },
      });
    });

    it('should batch multiple user loads', async () => {
      const mockUsers: User[] = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          name: 'User 1',
          createdAt: new Date(),
          lessons: [],
          documents: [],
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          name: 'User 2',
          createdAt: new Date(),
          lessons: [],
          documents: [],
        },
      ];
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const loader = service.getUserLoader();
      const [user1, user2] = await Promise.all([
        loader.load('user-1'),
        loader.load('user-2'),
      ]);

      expect(user1).toEqual(mockUsers[0]);
      expect(user2).toEqual(mockUsers[1]);
      expect(prismaService.user.findMany).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
      });
    });

    it('should return null for non-existent user', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getUserLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });

    it('should handle multiple loads with missing users', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        lessons: [],
        documents: [],
      };
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const loader = service.getUserLoader();
      const [user1, user2] = await Promise.all([
        loader.load('user-1'),
        loader.load('non-existent'),
      ]);

      expect(user1).toEqual(mockUser);
      expect(user2).toBeNull();
    });
  });

  describe('getLessonLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getLessonLoader();
      expect(loader).toBeDefined();
    });

    it('should load a single lesson', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        content: 'Content',
        userId: 'user-1',
        createdAt: new Date(),
      };
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue([
        mockLesson,
      ]);

      const loader = service.getLessonLoader();
      const result = await loader.load('lesson-1');

      expect(result).toEqual(mockLesson as unknown as Lesson);
      expect(prismaService.lesson.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['lesson-1'] } },
      });
    });

    it('should return null for non-existent lesson', async () => {
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getLessonLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getLessonsByUserLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getLessonsByUserLoader();
      expect(loader).toBeDefined();
    });

    it('should load lessons for a user', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          title: 'Lesson 1',
          content: 'Content 1',
          userId: 'user-1',
          createdAt: new Date(),
        },
        {
          id: 'lesson-2',
          title: 'Lesson 2',
          content: 'Content 2',
          userId: 'user-1',
          createdAt: new Date(),
        },
      ];
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue(
        mockLessons,
      );

      const loader = service.getLessonsByUserLoader();
      const result = await loader.load('user-1');

      expect(result).toEqual(mockLessons as unknown as Lesson[]);
      expect(prismaService.lesson.findMany).toHaveBeenCalledWith({
        where: { userId: { in: ['user-1'] } },
      });
    });

    it('should return empty array when user has no lessons', async () => {
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getLessonsByUserLoader();
      const result = await loader.load('user-1');

      expect(result).toEqual([]);
    });

    it('should batch multiple user lesson loads', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          title: 'Lesson 1',
          content: 'Content 1',
          userId: 'user-1',
          createdAt: new Date(),
        },
        {
          id: 'lesson-2',
          title: 'Lesson 2',
          content: 'Content 2',
          userId: 'user-2',
          createdAt: new Date(),
        },
      ];
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue(
        mockLessons,
      );

      const loader = service.getLessonsByUserLoader();
      const [lessons1, lessons2] = await Promise.all([
        loader.load('user-1'),
        loader.load('user-2'),
      ]);

      expect(lessons1).toEqual([mockLessons[0] as unknown as Lesson]);
      expect(lessons2).toEqual([mockLessons[1] as unknown as Lesson]);
      expect(prismaService.lesson.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle lessons with unexpected userIds in batch', async () => {
      // This tests the ?? [] fallback branch when a lesson has a userId
      // that wasn't in the initial request (edge case)
      const mockLessons = [
        {
          id: 'lesson-1',
          title: 'Lesson 1',
          content: 'Content 1',
          userId: 'user-1',
          createdAt: new Date(),
        },
      ];
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue(
        mockLessons,
      );

      const loader = service.getLessonsByUserLoader();
      // Request user-2 which has no lessons
      const result = await loader.load('user-2');

      expect(result).toEqual([]);
    });
  });

  describe('getDocumentLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getDocumentLoader();
      expect(loader).toBeDefined();
    });

    it('should load a single document', async () => {
      const mockDocument = {
        id: 'doc-1',
        title: 'Test Document',
        userId: 'user-1',
        createdAt: new Date(),
      };
      (prismaService.document.findMany as jest.Mock).mockResolvedValue([
        mockDocument,
      ]);

      const loader = service.getDocumentLoader();
      const result = await loader.load('doc-1');

      expect(result).toEqual(mockDocument as unknown as Document);
      expect(prismaService.document.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['doc-1'] } },
      });
    });

    it('should return null for non-existent document', async () => {
      (prismaService.document.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getDocumentLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getDocumentsByUserLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getDocumentsByUserLoader();
      expect(loader).toBeDefined();
    });

    it('should load documents for a user', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Document 1',
          userId: 'user-1',
          createdAt: new Date(),
        },
      ];
      (prismaService.document.findMany as jest.Mock).mockResolvedValue(
        mockDocuments,
      );

      const loader = service.getDocumentsByUserLoader();
      const result = await loader.load('user-1');

      expect(result).toEqual(mockDocuments as unknown as Document[]);
      expect(prismaService.document.findMany).toHaveBeenCalledWith({
        where: { userId: { in: ['user-1'] } },
      });
    });

    it('should return empty array when user has no documents', async () => {
      (prismaService.document.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getDocumentsByUserLoader();
      const result = await loader.load('user-1');

      expect(result).toEqual([]);
    });

    it('should handle documents with unexpected userIds in batch', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Document 1',
          userId: 'user-1',
          createdAt: new Date(),
        },
      ];
      (prismaService.document.findMany as jest.Mock).mockResolvedValue(
        mockDocuments,
      );

      const loader = service.getDocumentsByUserLoader();
      // Request user-2 which has no documents
      const result = await loader.load('user-2');

      expect(result).toEqual([]);
    });
  });

  describe('getDocumentChunkLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getDocumentChunkLoader();
      expect(loader).toBeDefined();
    });

    it('should load a single document chunk', async () => {
      const mockChunk: DocumentChunk = {
        id: 'chunk-1',
        documentId: 'doc-1',
        chunkIndex: 0,
        content: 'Content',
      };
      (prismaService.documentChunk.findMany as jest.Mock).mockResolvedValue([
        mockChunk,
      ]);

      const loader = service.getDocumentChunkLoader();
      const result = await loader.load('chunk-1');

      expect(result).toEqual(mockChunk);
      expect(prismaService.documentChunk.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['chunk-1'] } },
      });
    });

    it('should return null for non-existent chunk', async () => {
      (prismaService.documentChunk.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getDocumentChunkLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getChunksByDocumentLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getChunksByDocumentLoader();
      expect(loader).toBeDefined();
    });

    it('should load chunks for a document', async () => {
      const mockChunks: DocumentChunk[] = [
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          chunkIndex: 0,
          content: 'Content 1',
        },
        {
          id: 'chunk-2',
          documentId: 'doc-1',
          chunkIndex: 1,
          content: 'Content 2',
        },
      ];
      (prismaService.documentChunk.findMany as jest.Mock).mockResolvedValue(
        mockChunks,
      );

      const loader = service.getChunksByDocumentLoader();
      const result = await loader.load('doc-1');

      expect(result).toEqual(mockChunks);
      expect(prismaService.documentChunk.findMany).toHaveBeenCalledWith({
        where: { documentId: { in: ['doc-1'] } },
      });
    });

    it('should return empty array when document has no chunks', async () => {
      (prismaService.documentChunk.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getChunksByDocumentLoader();
      const result = await loader.load('doc-1');

      expect(result).toEqual([]);
    });

    it('should handle chunks with unexpected documentIds in batch', async () => {
      const mockChunks = [
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          chunkIndex: 0,
          content: 'Content',
        },
      ];
      (prismaService.documentChunk.findMany as jest.Mock).mockResolvedValue(
        mockChunks,
      );

      const loader = service.getChunksByDocumentLoader();
      // Request doc-2 which has no chunks
      const result = await loader.load('doc-2');

      expect(result).toEqual([]);
    });
  });

  describe('getEntityLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getEntityLoader();
      expect(loader).toBeDefined();
    });

    it('should load a single entity', async () => {
      const mockEntity: Entity = {
        id: 'entity-1',
        name: 'Test Entity',
        type: 'Person',
        mentionCount: 0,
        mentions: [],
        outgoing: [],
        incoming: [],
      };
      (prismaService.entity.findMany as jest.Mock).mockResolvedValue([
        mockEntity,
      ]);

      const loader = service.getEntityLoader();
      const result = await loader.load('entity-1');

      expect(result).toEqual(mockEntity);
      expect(prismaService.entity.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['entity-1'] } },
      });
    });

    it('should return null for non-existent entity', async () => {
      (prismaService.entity.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getEntityLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getEntityMentionLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getEntityMentionLoader();
      expect(loader).toBeDefined();
    });

    it('should load a single entity mention', async () => {
      const mockMention = {
        id: 'mention-1',
        entityId: 'entity-1',
        chunkId: 'chunk-1',
      };
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue([
        mockMention,
      ]);

      const loader = service.getEntityMentionLoader();
      const result = await loader.load('mention-1');

      expect(result).toEqual(mockMention as unknown as EntityMention);
      expect(prismaService.entityMention.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['mention-1'] } },
      });
    });

    it('should return null for non-existent mention', async () => {
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getEntityMentionLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getMentionsByEntityLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getMentionsByEntityLoader();
      expect(loader).toBeDefined();
    });

    it('should load mentions for an entity', async () => {
      const mockMentions = [
        {
          id: 'mention-1',
          entityId: 'entity-1',
          chunkId: 'chunk-1',
        },
      ];
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue(
        mockMentions,
      );

      const loader = service.getMentionsByEntityLoader();
      const result = await loader.load('entity-1');

      expect(result).toEqual(mockMentions as unknown as EntityMention[]);
      expect(prismaService.entityMention.findMany).toHaveBeenCalledWith({
        where: { entityId: { in: ['entity-1'] } },
      });
    });

    it('should return empty array when entity has no mentions', async () => {
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getMentionsByEntityLoader();
      const result = await loader.load('entity-1');

      expect(result).toEqual([]);
    });

    it('should handle mentions with unexpected entityIds in batch', async () => {
      const mockMentions = [
        {
          id: 'mention-1',
          entityId: 'entity-1',
          chunkId: 'chunk-1',
        },
      ];
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue(
        mockMentions,
      );

      const loader = service.getMentionsByEntityLoader();
      // Request entity-2 which has no mentions
      const result = await loader.load('entity-2');

      expect(result).toEqual([]);
    });
  });

  describe('getMentionsByChunkLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getMentionsByChunkLoader();
      expect(loader).toBeDefined();
    });

    it('should load mentions for a chunk', async () => {
      const mockMentions = [
        {
          id: 'mention-1',
          entityId: 'entity-1',
          chunkId: 'chunk-1',
        },
      ];
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue(
        mockMentions,
      );

      const loader = service.getMentionsByChunkLoader();
      const result = await loader.load('chunk-1');

      expect(result).toEqual(mockMentions as unknown as EntityMention[]);
      expect(prismaService.entityMention.findMany).toHaveBeenCalledWith({
        where: { chunkId: { in: ['chunk-1'] } },
      });
    });

    it('should return empty array when chunk has no mentions', async () => {
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue([]);

      const loader = service.getMentionsByChunkLoader();
      const result = await loader.load('chunk-1');

      expect(result).toEqual([]);
    });

    it('should handle mentions with unexpected chunkIds in batch', async () => {
      const mockMentions = [
        {
          id: 'mention-1',
          entityId: 'entity-1',
          chunkId: 'chunk-1',
        },
      ];
      (prismaService.entityMention.findMany as jest.Mock).mockResolvedValue(
        mockMentions,
      );

      const loader = service.getMentionsByChunkLoader();
      // Request chunk-2 which has no mentions
      const result = await loader.load('chunk-2');

      expect(result).toEqual([]);
    });
  });

  describe('getEntityRelationshipLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getEntityRelationshipLoader();
      expect(loader).toBeDefined();
    });

    it('should load a single entity relationship', async () => {
      const mockRelationship = {
        id: 'rel-1',
        fromEntity: 'entity-1',
        toEntity: 'entity-2',
        relation: 'knows',
      };
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue([mockRelationship]);

      const loader = service.getEntityRelationshipLoader();
      const result = await loader.load('rel-1');

      expect(result).toEqual(mockRelationship as unknown as EntityRelationship);
      expect(prismaService.entityRelationship.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['rel-1'] } },
      });
    });

    it('should return null for non-existent relationship', async () => {
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue([]);

      const loader = service.getEntityRelationshipLoader();
      const result = await loader.load('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getRelationshipsByFromEntityLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getRelationshipsByFromEntityLoader();
      expect(loader).toBeDefined();
    });

    it('should load relationships from an entity', async () => {
      const mockRelationships = [
        {
          id: 'rel-1',
          fromEntity: 'entity-1',
          toEntity: 'entity-2',
          relation: 'knows',
        },
      ];
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue(mockRelationships);

      const loader = service.getRelationshipsByFromEntityLoader();
      const result = await loader.load('entity-1');

      expect(result).toEqual(
        mockRelationships as unknown as EntityRelationship[],
      );
      expect(prismaService.entityRelationship.findMany).toHaveBeenCalledWith({
        where: { fromEntity: { in: ['entity-1'] } },
      });
    });

    it('should return empty array when entity has no outgoing relationships', async () => {
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue([]);

      const loader = service.getRelationshipsByFromEntityLoader();
      const result = await loader.load('entity-1');

      expect(result).toEqual([]);
    });

    it('should handle relationships with unexpected fromEntity in batch', async () => {
      const mockRelationships = [
        {
          id: 'rel-1',
          fromEntity: 'entity-1',
          toEntity: 'entity-2',
          relation: 'knows',
        },
      ];
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue(mockRelationships);

      const loader = service.getRelationshipsByFromEntityLoader();
      // Request entity-2 which has no outgoing relationships
      const result = await loader.load('entity-2');

      expect(result).toEqual([]);
    });
  });

  describe('getRelationshipsByToEntityLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getRelationshipsByToEntityLoader();
      expect(loader).toBeDefined();
    });

    it('should load relationships to an entity', async () => {
      const mockRelationships = [
        {
          id: 'rel-1',
          fromEntity: 'entity-2',
          toEntity: 'entity-1',
          relation: 'known_by',
        },
      ];
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue(mockRelationships);

      const loader = service.getRelationshipsByToEntityLoader();
      const result = await loader.load('entity-1');

      expect(result).toEqual(
        mockRelationships as unknown as EntityRelationship[],
      );
      expect(prismaService.entityRelationship.findMany).toHaveBeenCalledWith({
        where: { toEntity: { in: ['entity-1'] } },
      });
    });

    it('should return empty array when entity has no incoming relationships', async () => {
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue([]);

      const loader = service.getRelationshipsByToEntityLoader();
      const result = await loader.load('entity-1');

      expect(result).toEqual([]);
    });

    it('should handle relationships with unexpected toEntity in batch', async () => {
      const mockRelationships = [
        {
          id: 'rel-1',
          fromEntity: 'entity-1',
          toEntity: 'entity-2',
          relation: 'knows',
        },
      ];
      (
        prismaService.entityRelationship.findMany as jest.Mock
      ).mockResolvedValue(mockRelationships);

      const loader = service.getRelationshipsByToEntityLoader();
      // Request entity-1 which has no incoming relationships
      const result = await loader.load('entity-1');

      expect(result).toEqual([]);
    });
  });

  describe('getDocumentSourceByDocumentLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getDocumentSourceByDocumentLoader();
      expect(loader).toBeDefined();
    });

    it('should load document source by document id', async () => {
      const mockSource = {
        id: 'source-1',
        kind: 'MANUAL',
        documentId: 'doc-1',
        lastModifiedMs: null,
      } as unknown as DocumentSource;
      (prismaService.documentSource.findMany as jest.Mock).mockResolvedValue([
        mockSource,
      ]);

      const loader = service.getDocumentSourceByDocumentLoader();
      const result = await loader.load('doc-1');

      expect(result).toEqual(mockSource);
      expect(prismaService.documentSource.findMany).toHaveBeenCalledWith({
        where: { documentId: { in: ['doc-1'] } },
      });
    });

    it('should stringify lastModifiedMs when the Prisma row has a BigInt value', async () => {
      const mockRow = {
        id: 'source-2',
        kind: 'MANUAL',
        documentId: 'doc-2',
        lastModifiedMs: BigInt(1700000000000),
      };
      (prismaService.documentSource.findMany as jest.Mock).mockResolvedValue([
        mockRow,
      ]);

      const loader = service.getDocumentSourceByDocumentLoader();
      const result = await loader.load('doc-2');

      expect(result).toEqual({
        ...mockRow,
        lastModifiedMs: '1700000000000',
      });
    });

    it('should return null when document has no source', async () => {
      (prismaService.documentSource.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      const loader = service.getDocumentSourceByDocumentLoader();
      const result = await loader.load('doc-1');
      expect(result).toBeNull();
    });
  });

  describe('getMentionCountByEntityLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getMentionCountByEntityLoader();
      expect(loader).toBeDefined();
    });

    it('should load mention counts using groupBy with default 0s', async () => {
      (prismaService.entityMention.groupBy as jest.Mock).mockResolvedValue([
        { entityId: 'entity-1', _count: { _all: 3 } },
      ]);

      const loader = service.getMentionCountByEntityLoader();
      const [c1, c2] = await Promise.all([
        loader.load('entity-1'),
        loader.load('entity-2'),
      ]);

      expect(c1).toBe(3);
      expect(c2).toBe(0);
      expect(prismaService.entityMention.groupBy).toHaveBeenCalledWith({
        by: ['entityId'],
        where: { entityId: { in: ['entity-1', 'entity-2'] } },
        _count: { _all: true },
      });
    });
  });

  describe('getRelationshipEvidenceByRelationshipLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getRelationshipEvidenceByRelationshipLoader();
      expect(loader).toBeDefined();
    });

    it('should load evidence grouped by relationship id', async () => {
      const evidence1 = {
        id: 'ev-1',
        relationshipId: 'rel-1',
      } as unknown as EntityRelationshipEvidence;
      const evidence2 = {
        id: 'ev-2',
        relationshipId: 'rel-2',
      } as unknown as EntityRelationshipEvidence;

      (
        prismaService.entityRelationshipEvidence.findMany as jest.Mock
      ).mockResolvedValue([evidence1, evidence2]);

      const loader = service.getRelationshipEvidenceByRelationshipLoader();
      const [r1, r2] = await Promise.all([
        loader.load('rel-1'),
        loader.load('rel-2'),
      ]);

      expect(r1).toEqual([evidence1]);
      expect(r2).toEqual([evidence2]);
      expect(
        prismaService.entityRelationshipEvidence.findMany,
      ).toHaveBeenCalledWith({
        where: { relationshipId: { in: ['rel-1', 'rel-2'] } },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should ignore evidence rows for unexpected relationshipIds (defensive)', async () => {
      const unexpected = {
        id: 'ev-x',
        relationshipId: 'rel-unexpected',
      } as unknown as EntityRelationshipEvidence;

      (
        prismaService.entityRelationshipEvidence.findMany as jest.Mock
      ).mockResolvedValue([unexpected]);

      const loader = service.getRelationshipEvidenceByRelationshipLoader();
      const [r1, r2] = await Promise.all([
        loader.load('rel-1'),
        loader.load('rel-2'),
      ]);

      expect(r1).toEqual([]);
      expect(r2).toEqual([]);
    });
  });

  describe('getEvidenceMentionLinksByEvidenceLoader', () => {
    it('should return a DataLoader', () => {
      const loader = service.getEvidenceMentionLinksByEvidenceLoader();
      expect(loader).toBeDefined();
    });

    it('should load mention links grouped by evidence id', async () => {
      const link1 = {
        evidenceId: 'ev-1',
        mentionId: 'mention-1',
      } as unknown as EntityRelationshipEvidenceMention;
      const link2 = {
        evidenceId: 'ev-2',
        mentionId: 'mention-2',
      } as unknown as EntityRelationshipEvidenceMention;

      (
        prismaService.entityRelationshipEvidenceMention.findMany as jest.Mock
      ).mockResolvedValue([link1, link2]);

      const loader = service.getEvidenceMentionLinksByEvidenceLoader();
      const [l1, l2] = await Promise.all([
        loader.load('ev-1'),
        loader.load('ev-2'),
      ]);

      expect(l1).toEqual([link1]);
      expect(l2).toEqual([link2]);
      expect(
        prismaService.entityRelationshipEvidenceMention.findMany,
      ).toHaveBeenCalledWith({
        where: { evidenceId: { in: ['ev-1', 'ev-2'] } },
      });
    });

    it('should ignore links for unexpected evidenceIds (defensive)', async () => {
      const unexpected = {
        evidenceId: 'ev-unexpected',
        mentionId: 'mention-x',
      } as unknown as EntityRelationshipEvidenceMention;

      (
        prismaService.entityRelationshipEvidenceMention.findMany as jest.Mock
      ).mockResolvedValue([unexpected]);

      const loader = service.getEvidenceMentionLinksByEvidenceLoader();
      const [l1, l2] = await Promise.all([
        loader.load('ev-1'),
        loader.load('ev-2'),
      ]);

      expect(l1).toEqual([]);
      expect(l2).toEqual([]);
    });
  });
});
