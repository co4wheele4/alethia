import { Test, TestingModule } from '@nestjs/testing';
import { AppResolver } from './app.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService } from '../../openai/openai.service';
import { Lesson } from '@models/lesson.model';

describe('AppResolver', () => {
  let resolver: AppResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let openAIService: jest.Mocked<OpenAIService>;

  const mockLesson: Lesson = {
    id: 'lesson-1',
    title: 'Test Lesson',
    content: 'Test content',
    user: {} as unknown as Lesson['user'],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      lesson: {
        findMany: jest.fn(),
      },
      aiQuery: {
        create: jest.fn(),
      },
    };

    const mockOpenAIService = {
      getEmbeddingResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
      ],
    }).compile();

    resolver = module.get<AppResolver>(AppResolver);
    prismaService = module.get(PrismaService);
    openAIService = module.get(OpenAIService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('hello', () => {
    it('should return "Hello, Aletheia!"', () => {
      const result = resolver.hello();
      expect(result).toBe('Hello, Aletheia!');
    });
  });

  describe('lessons', () => {
    it('should return an array of lessons', async () => {
      const mockLessons = [mockLesson];
      const findManyMock = prismaService.lesson.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockLessons as unknown as typeof mockLessons,
      );

      const result = await resolver.lessons();

      expect(result).toEqual(mockLessons);
      expect(findManyMock).toHaveBeenCalled();
    });

    it('should return empty array when no lessons exist', async () => {
      const findManyMock = prismaService.lesson.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.lessons();

      expect(result).toEqual([]);
      expect(findManyMock).toHaveBeenCalled();
    });
  });

  describe('askAI', () => {
    it('should create an ai query with result and return answer', async () => {
      const mockAnswer = 'Test answer';
      const mockAiQuery = {
        id: 'query-1',
        userId: 'user-1',
        query: 'Test query',
        createdAt: new Date(),
      };

      const getEmbeddingResultMock =
        openAIService.getEmbeddingResult as jest.Mock;
      const createMock = prismaService.aiQuery.create as jest.Mock;
      getEmbeddingResultMock.mockResolvedValue(mockAnswer);
      createMock.mockResolvedValue(
        mockAiQuery as unknown as typeof mockAiQuery,
      );

      const result = await resolver.askAI('user-1', 'Test query');

      expect(result).toBe(mockAnswer);
      expect(getEmbeddingResultMock).toHaveBeenCalledWith('Test query');
      expect(createMock).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          query: 'Test query',
          results: {
            create: {
              answer: mockAnswer,
              score: 1,
            },
          },
        },
      });
    });
  });
});
