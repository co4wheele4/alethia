import { Test, TestingModule } from '@nestjs/testing';
import { LessonResolver } from './lesson.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { Lesson } from '@models/lesson.model';
import { User } from '@models/user.model';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

describe('LessonResolver', () => {
  let resolver: LessonResolver;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    lessons: [],
    documents: [],
    aiQueries: [],
  };

  const mockLesson: Lesson = {
    id: 'lesson-1',
    title: 'Test Lesson',
    content: 'Test content',
    user: mockUser,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      lesson: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<LessonResolver>(LessonResolver);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should have prisma service injected', () => {
    expect(resolver).toHaveProperty('prisma');
    expect(resolver['prisma']).toBe(prismaService);
  });

  describe('lessons', () => {
    it('should return an array of lessons', async () => {
      const mockLessons = [mockLesson];
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue(
        mockLessons as any,
      );

      const result = await resolver.lessons();

      expect(result).toEqual(mockLessons);
      expect(prismaService.lesson.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no lessons exist', async () => {
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue([]);

      const result = await resolver.lessons();

      expect(result).toEqual([]);
      expect(prismaService.lesson.findMany).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (prismaService.lesson.findMany as jest.Mock).mockRejectedValue(error);

      await expect(resolver.lessons()).rejects.toThrow('Database error');
    });
  });

  describe('lesson', () => {
    it('should return a lesson by id', async () => {
      (prismaService.lesson.findUnique as jest.Mock).mockResolvedValue(
        mockLesson as any,
      );

      const result = await resolver.lesson('lesson-1');

      expect(result).toEqual(mockLesson);
      expect(prismaService.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
      });
    });

    it('should return null when lesson not found', async () => {
      (prismaService.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await resolver.lesson('999');

      expect(result).toBeNull();
    });
  });

  describe('lessonsByUser', () => {
    it('should return lessons for a specific user', async () => {
      const mockLessons = [mockLesson];
      (prismaService.lesson.findMany as jest.Mock).mockResolvedValue(
        mockLessons as any,
      );

      const result = await resolver.lessonsByUser('user-1');

      expect(result).toEqual(mockLessons);
      expect(prismaService.lesson.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('createLesson', () => {
    it('should create a new lesson', async () => {
      const newLesson = { ...mockLesson, title: 'New Lesson' };
      (prismaService.lesson.create as jest.Mock).mockResolvedValue(
        newLesson as any,
      );

      const result = await resolver.createLesson(
        'New Lesson',
        'user-1',
        'Content',
      );

      expect(result).toEqual(newLesson);
      expect(prismaService.lesson.create).toHaveBeenCalledWith({
        data: { title: 'New Lesson', content: 'Content', userId: 'user-1' },
      });
    });

    it('should create lesson without content', async () => {
      const newLesson = { ...mockLesson, content: null };
      (prismaService.lesson.create as jest.Mock).mockResolvedValue(
        newLesson as any,
      );

      const result = await resolver.createLesson('New Lesson', 'user-1');

      expect(result).toEqual(newLesson);
      expect(prismaService.lesson.create).toHaveBeenCalledWith({
        data: { title: 'New Lesson', content: undefined, userId: 'user-1' },
      });
    });
  });

  describe('updateLesson', () => {
    it('should update lesson title and content', async () => {
      const updatedLesson = {
        ...mockLesson,
        title: 'Updated Title',
        content: 'Updated content',
      };
      (prismaService.lesson.update as jest.Mock).mockResolvedValue(
        updatedLesson as any,
      );

      const result = await resolver.updateLesson(
        'lesson-1',
        'Updated Title',
        'Updated content',
      );

      expect(result).toEqual(updatedLesson);
      expect(prismaService.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        data: { title: 'Updated Title', content: 'Updated content' },
      });
    });

    it('should update only title', async () => {
      const updatedLesson = { ...mockLesson, title: 'Updated Title' };
      (prismaService.lesson.update as jest.Mock).mockResolvedValue(
        updatedLesson as any,
      );

      const result = await resolver.updateLesson('lesson-1', 'Updated Title');

      expect(result).toEqual(updatedLesson);
      expect(prismaService.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        data: { title: 'Updated Title', content: undefined },
      });
    });

    it('should update only content', async () => {
      const updatedLesson = { ...mockLesson, content: 'Updated content' };
      (prismaService.lesson.update as jest.Mock).mockResolvedValue(
        updatedLesson as any,
      );

      const result = await resolver.updateLesson(
        'lesson-1',
        undefined,
        'Updated content',
      );

      expect(result).toEqual(updatedLesson);
      expect(prismaService.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        data: { title: undefined, content: 'Updated content' },
      });
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      (prismaService.lesson.update as jest.Mock).mockRejectedValue(error);

      await expect(resolver.updateLesson('lesson-1', 'Title')).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('deleteLesson', () => {
    it('should delete a lesson', async () => {
      (prismaService.lesson.delete as jest.Mock).mockResolvedValue(
        mockLesson as any,
      );

      const result = await resolver.deleteLesson('lesson-1');

      expect(result).toEqual(mockLesson);
      expect(prismaService.lesson.delete).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
      });
    });
  });

  describe('user', () => {
    it('should resolve user field', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      // Mock lesson with userId from database field
      const lessonWithUserId = { ...mockLesson, userId: mockUser.id } as any;
      const result = await resolver.user(lessonWithUserId);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should handle null user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock lesson with userId from database field
      const lessonWithUserId = { ...mockLesson, userId: 'non-existent' } as any;
      const result = await resolver.user(lessonWithUserId);

      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
    });
  });

  it('should build GraphQL schema with LessonResolver', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        LessonResolver,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const lessonResolver = module.get<LessonResolver>(LessonResolver);
    expect(lessonResolver).toBeDefined();

    await app.close();
  });
});
