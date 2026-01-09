import { Test, TestingModule } from '@nestjs/testing';
import { DocumentResolver } from './document.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { Document } from '@models/document.model';
import { User } from '@models/user.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('DocumentResolver', () => {
  let resolver: DocumentResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let dataLoaderService: jest.Mocked<DataLoaderService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    lessons: [],
    documents: [],
    aiQueries: [],
  };

  const mockDocument: Document = {
    id: 'doc-1',
    title: 'Test Document',
    user: mockUser,
    createdAt: new Date(),
    chunks: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      document: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      documentChunk: {
        findMany: jest.fn(),
      },
    };

    const mockDataLoaderService = {
      getUserLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue(null),
      }),
      getChunksByDocumentLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentResolver,
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

    resolver = await module.resolve<DocumentResolver>(DocumentResolver);
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

  describe('documents', () => {
    it('should return an array of documents', async () => {
      const mockDocuments = [mockDocument];
      const findManyMock = prismaService.document.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockDocuments as unknown as typeof mockDocuments,
      );

      const result = await resolver.documents();

      expect(result).toEqual(mockDocuments);
      expect(findManyMock).toHaveBeenCalled();
    });

    it('should return empty array when no documents exist', async () => {
      const findManyMock = prismaService.document.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.documents();

      expect(result).toEqual([]);
    });
  });

  describe('document', () => {
    it('should return a document by id', async () => {
      const findUniqueMock = prismaService.document.findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(
        mockDocument as unknown as typeof mockDocument,
      );

      const result = await resolver.document('doc-1');

      expect(result).toEqual(mockDocument);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
    });

    it('should return null when document not found', async () => {
      const findUniqueMock = prismaService.document.findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(null);

      const result = await resolver.document('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('documentsByUser', () => {
    it('should return documents for a specific user', async () => {
      const mockDocuments = [mockDocument];
      const findManyMock = prismaService.document.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockDocuments as unknown as typeof mockDocuments,
      );

      const result = await resolver.documentsByUser('user-1');

      expect(result).toEqual(mockDocuments);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return empty array when user has no documents', async () => {
      const findManyMock = prismaService.document.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.documentsByUser('user-2');

      expect(result).toEqual([]);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId: 'user-2' },
      });
    });
  });

  describe('createDocument', () => {
    it('should create a new document', async () => {
      const newDocument = { ...mockDocument, title: 'New Document' };
      const createMock = prismaService.document.create as jest.Mock;
      createMock.mockResolvedValue(
        newDocument as unknown as typeof newDocument,
      );

      const result = await resolver.createDocument('New Document', 'user-1');

      expect(result).toEqual(newDocument);
      expect(createMock).toHaveBeenCalledWith({
        data: { title: 'New Document', userId: 'user-1' },
      });
    });
  });

  describe('updateDocument', () => {
    it('should update document title', async () => {
      const updatedDocument = { ...mockDocument, title: 'Updated Title' };
      const updateMock = prismaService.document.update as jest.Mock;
      updateMock.mockResolvedValue(
        updatedDocument as unknown as typeof updatedDocument,
      );

      const result = await resolver.updateDocument('doc-1', 'Updated Title');

      expect(result).toEqual(updatedDocument);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { title: 'Updated Title' },
      });
    });

    it('should handle undefined title', async () => {
      const updateMock = prismaService.document.update as jest.Mock;
      updateMock.mockResolvedValue(
        mockDocument as unknown as typeof mockDocument,
      );

      const result = await resolver.updateDocument('doc-1', undefined);

      expect(result).toEqual(mockDocument);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { title: undefined },
      });
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      const deleteMock = prismaService.document.delete as jest.Mock;
      deleteMock.mockResolvedValue(
        mockDocument as unknown as typeof mockDocument,
      );

      const result = await resolver.deleteDocument('doc-1');

      expect(result).toEqual(mockDocument);
      expect(deleteMock).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
    });
  });

  describe('user', () => {
    it('should resolve user field', async () => {
      const loadMock = jest.fn().mockResolvedValue(mockUser);
      (dataLoaderService.getUserLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      // Mock document with userId from database field
      const documentWithUserId = {
        ...mockDocument,
        userId: mockUser.id,
      } as unknown as import('../models/document.model').Document & {
        userId: string;
      };
      const result = await resolver.user(documentWithUserId);

      expect(result).toEqual(mockUser);
      expect(loadMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle null user', async () => {
      const loadMock = jest.fn().mockResolvedValue(null);
      (dataLoaderService.getUserLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      // Mock document with userId from database field
      const documentWithUserId = {
        ...mockDocument,
        userId: 'non-existent',
      } as unknown as import('../models/document.model').Document & {
        userId: string;
      };
      const result = await resolver.user(documentWithUserId);

      expect(result).toBeNull();
      expect(loadMock).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('chunks', () => {
    it('should resolve chunks field', async () => {
      const mockChunks: DocumentChunk[] = [
        {
          id: 'chunk-1',
          chunkIndex: 0,
          content: 'Content',
          documentId: 'doc-1',
        },
      ];
      const loadMock = jest.fn().mockResolvedValue(mockChunks);
      (
        dataLoaderService.getChunksByDocumentLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.chunks(mockDocument);

      expect(result).toEqual(mockChunks);
      expect(loadMock).toHaveBeenCalledWith(mockDocument.id);
    });

    it('should return empty array when document has no chunks', async () => {
      const loadMock = jest.fn().mockResolvedValue([]);
      (
        dataLoaderService.getChunksByDocumentLoader as jest.Mock
      ).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.chunks(mockDocument);

      expect(result).toEqual([]);
      expect(loadMock).toHaveBeenCalledWith(mockDocument.id);
    });
  });

  it('should build GraphQL schema with DocumentResolver', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        DocumentResolver,
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

    const documentResolver =
      await module.resolve<DocumentResolver>(DocumentResolver);
    expect(documentResolver).toBeDefined();

    await app.close();
  });
});
