import { Test } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '@prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { IngestDocumentInput } from '../graphql/inputs/ingest-document.input';
import { DocumentSourceKindInput } from '../graphql/inputs/document-source.input';

describe('IngestionService', () => {
  let service: IngestionService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService: any = {
      document: {
        create: jest.fn(),
      },
      documentSource: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      documentChunk: {
        createMany: jest.fn(),
      },
    };
    mockPrismaService.$transaction = jest.fn((callback) =>
      callback(mockPrismaService),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = moduleRef.get<IngestionService>(IngestionService);
    prismaService = moduleRef.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingest', () => {
    const validInput: IngestDocumentInput = {
      title: 'Test Doc',
      userId: 'user-1',
      content: 'Page 1 Paragraph 1\n\nPage 1 Paragraph 2\fPage 2 Paragraph 1',
      source: {
        kind: DocumentSourceKindInput.FILE,
        filename: 'test.txt',
      },
    };

    it('should ingest a document successfully', async () => {
      prismaService.documentSource.findFirst.mockResolvedValue(null);
      prismaService.document.create.mockResolvedValue({
        id: 'doc-1',
        title: 'Test Doc',
        userId: 'user-1',
      } as any);

      const result = await service.ingest(validInput);

      expect(result).toBeDefined();
      expect(result.id).toBe('doc-1');
      expect(prismaService.document.create).toHaveBeenCalled();
      expect(prismaService.documentSource.create).toHaveBeenCalled();
      expect(prismaService.documentChunk.createMany).toHaveBeenCalledWith({
        data: [
          { content: 'Page 1 Paragraph 1', chunkIndex: 0, documentId: 'doc-1' },
          { content: 'Page 1 Paragraph 2', chunkIndex: 1, documentId: 'doc-1' },
          { content: 'Page 2 Paragraph 1', chunkIndex: 2, documentId: 'doc-1' },
        ],
      });
    });

    it('should return existing document if already ingested (idempotency)', async () => {
      const existingDoc = {
        id: 'doc-existing',
        title: 'Test Doc',
        userId: 'user-1',
      };
      prismaService.documentSource.findFirst.mockResolvedValue({
        documentId: 'doc-existing',
        document: existingDoc,
      } as any);

      const result = await service.ingest(validInput);

      expect(result).toEqual(existingDoc);
      expect(prismaService.document.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if content is empty', async () => {
      const invalidInput = { ...validInput, content: '' };
      await expect(service.ingest(invalidInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if filename is missing for FILE source', async () => {
      const invalidInput = {
        ...validInput,
        source: { kind: DocumentSourceKindInput.FILE },
      } as any;
      await expect(service.ingest(invalidInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if requestedUrl is missing for URL source', async () => {
      const invalidInput = {
        ...validInput,
        source: { kind: DocumentSourceKindInput.URL },
      } as any;
      await expect(service.ingest(invalidInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle lastModifiedMs as BigInt', async () => {
      const inputWithDate = {
        ...validInput,
        source: {
          ...validInput.source,
          lastModifiedMs: '1700000000000',
        },
      };
      prismaService.documentSource.findFirst.mockResolvedValue(null);
      prismaService.document.create.mockResolvedValue({ id: 'doc-1' } as any);

      await service.ingest(inputWithDate);

      expect(prismaService.documentSource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastModifiedMs: BigInt('1700000000000'),
          }),
        }),
      );
    });

    it('should use requestedUrl as sourceLabel if filename is missing', async () => {
      const urlInput = {
        ...validInput,
        source: {
          kind: DocumentSourceKindInput.URL,
          requestedUrl: 'http://example.com',
        },
      };
      prismaService.documentSource.findFirst.mockResolvedValue(null);
      prismaService.document.create.mockResolvedValue({ id: 'doc-url' } as any);

      await service.ingest(urlInput);

      expect(prismaService.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sourceLabel: 'http://example.com',
          }),
        }),
      );
    });

    it('should use title as sourceLabel if filename and requestedUrl are missing', async () => {
      const manualInput = {
        ...validInput,
        source: {
          kind: DocumentSourceKindInput.MANUAL,
        },
      };
      prismaService.documentSource.findFirst.mockResolvedValue(null);
      prismaService.document.create.mockResolvedValue({
        id: 'doc-manual',
      } as any);

      await service.ingest(manualInput);

      expect(prismaService.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sourceLabel: 'Test Doc',
          }),
        }),
      );
    });
  });
});
