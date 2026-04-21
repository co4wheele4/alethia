import { Test } from '@nestjs/testing';
import { AppResolver } from './app.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { Lesson } from '@models/lesson.model';

describe('AppResolver', () => {
  let resolver: AppResolver;
  let prismaService: jest.Mocked<PrismaService>;

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
    };

    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        AppResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = moduleRef.get<AppResolver>(AppResolver);
    prismaService = moduleRef.get(PrismaService);
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
      findManyMock.mockResolvedValue(mockLessons);

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
});
