import { Test, TestingModule } from '@nestjs/testing';
import { LessonResolver } from './lesson.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { Lesson } from '@models/lesson.model';
import { User } from '@models/user.model';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('LessonResolver', () => {
  let resolver: LessonResolver;
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

    const mockDataLoaderService = {
      getUserLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue(null),
      }),
    };

    const moduleRef: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>["compile"]>> = await Test.createTestingModule({
      providers: [
        LessonResolver,
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

    resolver = await moduleRef.resolve<LessonResolver>(LessonResolver);
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
      const loadMock = jest.fn().mockResolvedValue(mockUser);
      (dataLoaderService.getUserLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      // Mock lesson with userId from database field
      const lessonWithUserId = {
        ...mockLesson,
        userId: mockUser.id,
      } as unknown as import('../models/lesson.model').Lesson & {
        userId: string;
      };
      const result = await resolver.user(lessonWithUserId);

      expect(result).toEqual(mockUser);
      expect(loadMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle null user', async () => {
      const loadMock = jest.fn().mockResolvedValue(null);
      (dataLoaderService.getUserLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      // Mock lesson with userId from database field
      const lessonWithUserId = {
        ...mockLesson,
        userId: 'non-existent',
      } as unknown as import('../models/lesson.model').Lesson & {
        userId: string;
      };
      const result = await resolver.user(lessonWithUserId);

      expect(result).toBeNull();
      expect(loadMock).toHaveBeenCalledWith('non-existent');
    });
  });

  it('should build GraphQL schema with LessonResolver', async () => {
    const moduleRef: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>["compile"]>> = await Test.createTestingModule({
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
        {
          provide: DataLoaderService,
          useValue: dataLoaderService,
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const lessonResolver = await moduleRef.resolve<LessonResolver>(LessonResolver);
    expect(lessonResolver).toBeDefined();

    await app.close();
  });
});
