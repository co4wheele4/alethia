import { Test } from '@nestjs/testing';
import { ExtractionService } from './extraction.service';
import { PrismaService } from '@prisma/prisma.service';
import { OpenAIService } from '../openai/openai.service';
import { SuggestionKind, SuggestionStatus } from '@prisma/client';

describe('ExtractionService', () => {
  let service: ExtractionService;
  let prisma: any;
  let openai: any;

  beforeEach(async () => {
    const mockPrisma: any = {
      documentChunk: {
        findUnique: jest.fn(),
      },
      aiExtractionSuggestion: {
        createMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      entity: {
        upsert: jest.fn(),
      },
      entityMention: {
        create: jest.fn(),
      },
      entityRelationship: {
        create: jest.fn(),
      },
      entityRelationshipEvidence: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(mockPrisma)),
    };

    const mockOpenAI = {
      extract: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ExtractionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OpenAIService, useValue: mockOpenAI },
      ],
    }).compile();

    service = module.get<ExtractionService>(ExtractionService);
    prisma = module.get(PrismaService);
    openai = module.get(OpenAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('proposeExtraction', () => {
    it('should throw error if chunk not found', async () => {
      prisma.documentChunk.findUnique.mockResolvedValue(null);
      await expect(service.proposeExtraction('c1')).rejects.toThrow(
        'Chunk c1 not found',
      );
    });

    it('should call openai and save suggestions', async () => {
      const chunk = { id: 'c1', content: 'Alice met Bob.' };
      prisma.documentChunk.findUnique.mockResolvedValue(chunk);
      openai.extract.mockResolvedValue({
        entities: [
          {
            name: 'Alice',
            type: 'PERSON',
            excerpt: 'Alice',
            startOffset: 0,
            endOffset: 5,
          },
          {
            name: 'Bob',
            type: 'PERSON',
            excerpt: 'Bob',
            startOffset: 9,
            endOffset: 12,
          },
        ],
        relationships: [
          {
            subjectName: 'Alice',
            subjectType: 'PERSON',
            relation: 'MET',
            objectName: 'Bob',
            objectType: 'PERSON',
            excerpt: 'met',
            startOffset: 6,
            endOffset: 9,
          },
        ],
      });

      await service.proposeExtraction('c1');

      expect(prisma.aiExtractionSuggestion.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            entityName: 'Alice',
            kind: SuggestionKind.ENTITY_MENTION,
          }),
          expect.objectContaining({
            subjectName: 'Alice',
            objectName: 'Bob',
            kind: SuggestionKind.RELATIONSHIP,
          }),
        ]),
      });
    });

    it('should find correct offsets even if LLM gives wrong ones', async () => {
      const chunk = { id: 'c1', content: 'The user is Alice.' };
      prisma.documentChunk.findUnique.mockResolvedValue(chunk);
      openai.extract.mockResolvedValue({
        entities: [
          {
            name: 'Alice',
            type: 'PERSON',
            excerpt: 'Alice',
            startOffset: 100,
            endOffset: 105,
          }, // Wrong offsets
        ],
      });

      await service.proposeExtraction('c1');

      expect(prisma.aiExtractionSuggestion.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            entityName: 'Alice',
            startOffset: 12, // Corrected: "The user is Alice." (0-based: T=0, h=1, e=2, space=3, u=4, s=5, e=6, r=7, space=8, i=9, s=10, space=11, A=12)
            endOffset: 17,
          }),
        ],
      });
    });

    it('should find closest occurrence if multiple exist', async () => {
      const chunk = { id: 'c1', content: 'Alice and Alice.' };
      prisma.documentChunk.findUnique.mockResolvedValue(chunk);
      openai.extract.mockResolvedValue({
        entities: [
          {
            name: 'Alice',
            type: 'PERSON',
            excerpt: 'Alice',
            startOffset: 10,
            endOffset: 15,
          },
        ],
      });

      await service.proposeExtraction('c1');

      expect(prisma.aiExtractionSuggestion.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            entityName: 'Alice',
            startOffset: 10,
            endOffset: 15,
          }),
        ],
      });
    });

    it('should handle excerpt not found', async () => {
      const chunk = { id: 'c1', content: 'Hello world.' };
      prisma.documentChunk.findUnique.mockResolvedValue(chunk);
      openai.extract.mockResolvedValue({
        entities: [
          {
            name: 'Alice',
            type: 'PERSON',
            excerpt: 'Alice',
            startOffset: 0,
            endOffset: 5,
          },
        ],
      });

      await service.proposeExtraction('c1');

      expect(prisma.aiExtractionSuggestion.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            entityName: 'Alice',
            startOffset: 0, // Fallback to LLM offset
          }),
        ],
      });
    });

    it('should handle empty excerpt', async () => {
      const chunk = { id: 'c1', content: 'Alice met Bob.' };
      prisma.documentChunk.findUnique.mockResolvedValue(chunk);
      openai.extract.mockResolvedValue({
        entities: [
          {
            name: 'Alice',
            type: 'PERSON',
            excerpt: '',
            startOffset: 0,
            endOffset: 5,
          },
        ],
      });

      await service.proposeExtraction('c1');

      expect(prisma.aiExtractionSuggestion.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            entityName: 'Alice',
            startOffset: 0,
          }),
        ],
      });
    });

    it('should handle relationship excerpt not found', async () => {
      const chunk = { id: 'c1', content: 'Alice met Bob.' };
      prisma.documentChunk.findUnique.mockResolvedValue(chunk);
      openai.extract.mockResolvedValue({
        relationships: [
          {
            subjectName: 'Alice',
            subjectType: 'PERSON',
            relation: 'MET',
            objectName: 'Bob',
            objectType: 'PERSON',
            excerpt: 'missing',
            startOffset: 6,
            endOffset: 9,
          },
        ],
      });

      await service.proposeExtraction('c1');

      expect(prisma.aiExtractionSuggestion.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            relation: 'MET',
            startOffset: 6,
          }),
        ],
      });
    });
  });

  describe('acceptSuggestion', () => {
    it('should accept an entity mention suggestion', async () => {
      const suggestion = {
        id: 's1',
        chunkId: 'c1',
        kind: SuggestionKind.ENTITY_MENTION,
        status: SuggestionStatus.PENDING,
        entityName: 'Alice',
        entityType: 'PERSON',
        excerpt: 'Alice',
        startOffset: 0,
        endOffset: 5,
      };
      prisma.aiExtractionSuggestion.findUnique.mockResolvedValue(suggestion);
      prisma.entity.upsert.mockResolvedValue({ id: 'e1' });

      await service.acceptSuggestion('s1');

      expect(prisma.entity.upsert).toHaveBeenCalled();
      expect(prisma.entityMention.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityId: 'e1', chunkId: 'c1' }),
      });
      expect(prisma.aiExtractionSuggestion.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: SuggestionStatus.ACCEPTED },
      });
    });

    it('should accept a relationship suggestion', async () => {
      const suggestion = {
        id: 's1',
        chunkId: 'c1',
        kind: SuggestionKind.RELATIONSHIP,
        status: SuggestionStatus.PENDING,
        subjectName: 'Alice',
        subjectType: 'PERSON',
        objectName: 'Bob',
        objectType: 'PERSON',
        relation: 'MET',
        excerpt: 'met',
        startOffset: 6,
        endOffset: 9,
      };
      prisma.aiExtractionSuggestion.findUnique.mockResolvedValue(suggestion);
      prisma.entity.upsert
        .mockResolvedValueOnce({ id: 'e1' })
        .mockResolvedValueOnce({ id: 'e2' });
      prisma.entityRelationship.create.mockResolvedValue({ id: 'r1' });

      await service.acceptSuggestion('s1');

      expect(prisma.entity.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.entityRelationship.create).toHaveBeenCalled();
      expect(prisma.entityRelationshipEvidence.create).toHaveBeenCalled();
      expect(prisma.aiExtractionSuggestion.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: SuggestionStatus.ACCEPTED },
      });
    });

    it('should throw if suggestion not found or already accepted', async () => {
      prisma.aiExtractionSuggestion.findUnique.mockResolvedValue(null);
      await expect(service.acceptSuggestion('s1')).rejects.toThrow(
        'Suggestion not found or already processed',
      );

      prisma.aiExtractionSuggestion.findUnique.mockResolvedValue({
        status: SuggestionStatus.ACCEPTED,
      });
      await expect(service.acceptSuggestion('s1')).rejects.toThrow(
        'Suggestion not found or already processed',
      );
    });
  });

  describe('rejectSuggestion', () => {
    it('should mark suggestion as rejected', async () => {
      await service.rejectSuggestion('s1');
      expect(prisma.aiExtractionSuggestion.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: SuggestionStatus.REJECTED },
      });
    });
  });
});
