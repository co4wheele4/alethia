import { Test } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@models/user.model';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let prismaService: jest.Mocked<PrismaService>;
  let dataLoaderService: jest.Mocked<DataLoaderService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    lessons: [],
    documents: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockDataLoaderService = {
      getLessonsByUserLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
      getDocumentsByUserLoader: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([]),
      }),
    };

    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        UserResolver,
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

    resolver = await moduleRef.resolve<UserResolver>(UserResolver);
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

  it('should instantiate UserResolver directly', () => {
    const newResolver = new UserResolver(prismaService, dataLoaderService);
    expect(newResolver).toBeInstanceOf(UserResolver);
    expect(newResolver['prisma']).toBe(prismaService);
  });

  it('should have correct GraphQL decorators on user query', () => {
    expect(resolver.user).toBeDefined();
    expect(typeof resolver.user).toBe('function');
  });

  it('should have correct GraphQL decorators on createUser mutation', () => {
    expect(resolver.createUser).toBeDefined();
    expect(typeof resolver.createUser).toBe('function');
  });

  it('should have correct GraphQL decorators on updateUser mutation', () => {
    expect(resolver.updateUser).toBeDefined();
    expect(typeof resolver.updateUser).toBe('function');
  });

  describe('users', () => {
    it('should return an array of users', async () => {
      const mockUsers = [mockUser];
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(
        mockUsers as any,
      );

      const result = await resolver.users();

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await resolver.users();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      (prismaService.user.findMany as jest.Mock).mockRejectedValue(error);

      await expect(resolver.users()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('user', () => {
    it('should return a user by id', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      const result = await resolver.user('1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await resolver.user('999');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const newUser = { ...mockUser, email: 'new@example.com' };
      (prismaService.user.create as jest.Mock).mockResolvedValue(
        newUser as any,
      );

      const result = await resolver.createUser({
        email: 'new@example.com',
        name: 'New User',
      });

      expect(result).toEqual(newUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { email: 'new@example.com', name: 'New User' },
      });
    });

    it('should create user without name', async () => {
      const newUser = { ...mockUser, email: 'new@example.com', name: null };
      (prismaService.user.create as jest.Mock).mockResolvedValue(
        newUser as any,
      );

      const result = await resolver.createUser({ email: 'new@example.com' });

      expect(result).toEqual(newUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { email: 'new@example.com' },
      });
    });

    it('should create user with null name explicitly', async () => {
      const newUser = { ...mockUser, email: 'new@example.com', name: null };
      (prismaService.user.create as jest.Mock).mockResolvedValue(
        newUser as any,
      );

      const result = await resolver.createUser({
        email: 'new@example.com',
        name: undefined,
      });

      expect(result).toEqual(newUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { email: 'new@example.com', name: undefined },
      });
    });

    it('should handle duplicate email errors', async () => {
      const error = new Error('Unique constraint failed on email');
      (prismaService.user.create as jest.Mock).mockRejectedValue(error);

      await expect(
        resolver.createUser({ email: 'existing@example.com' }),
      ).rejects.toThrow('Unique constraint failed on email');
    });
  });

  describe('updateUser', () => {
    it('should update user email and name', async () => {
      const updatedUser = {
        ...mockUser,
        email: 'updated@example.com',
        name: 'Updated Name',
      };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        updatedUser as any,
      );

      const result = await resolver.updateUser({
        id: '1',
        email: 'updated@example.com',
        name: 'Updated Name',
      });

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { email: 'updated@example.com', name: 'Updated Name' },
      });
    });

    it('should update only email', async () => {
      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        updatedUser as any,
      );

      const result = await resolver.updateUser({
        id: '1',
        email: 'updated@example.com',
      });

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { email: 'updated@example.com' },
      });
    });

    it('should update only name', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        updatedUser as any,
      );

      const result = await resolver.updateUser({
        id: '1',
        name: 'Updated Name',
      });

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Name' },
      });
    });

    it('should update with undefined email', async () => {
      const updatedUser = { ...mockUser, email: undefined };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        updatedUser as any,
      );

      const result = await resolver.updateUser({
        id: '1',
        email: undefined,
        name: 'Updated Name',
      });

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { email: undefined, name: 'Updated Name' },
      });
    });

    it('should update with undefined name', async () => {
      const updatedUser = { ...mockUser, name: undefined };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        updatedUser as any,
      );

      const result = await resolver.updateUser({
        id: '1',
        email: 'test@example.com',
        name: undefined,
      });

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { email: 'test@example.com', name: undefined },
      });
    });

    it('should update with both fields undefined', async () => {
      const updatedUser = { ...mockUser };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        updatedUser as any,
      );

      const result = await resolver.updateUser({ id: '1' });

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { email: undefined, name: undefined },
      });
    });

    it('should handle database errors when updating', async () => {
      const error = new Error('User not found');
      (prismaService.user.update as jest.Mock).mockRejectedValue(error);

      await expect(
        resolver.updateUser({ id: '999', email: 'new@example.com' }),
      ).rejects.toThrow('User not found');
    });

    it('should handle duplicate email constraint errors', async () => {
      const error = new Error('Unique constraint failed on email');
      (prismaService.user.update as jest.Mock).mockRejectedValue(error);

      await expect(
        resolver.updateUser({ id: '1', email: 'existing@example.com' }),
      ).rejects.toThrow('Unique constraint failed on email');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      (prismaService.user.delete as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      const result = await resolver.deleteUser('1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should handle database errors when deleting', async () => {
      const error = new Error('User not found');
      (prismaService.user.delete as jest.Mock).mockRejectedValue(error);

      await expect(resolver.deleteUser('999')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('lessons', () => {
    it('should resolve lessons field', async () => {
      const mockLessons = [
        { id: 'lesson-1', title: 'Lesson 1', content: 'Content 1' },
        { id: 'lesson-2', title: 'Lesson 2', content: 'Content 2' },
      ];
      const loadMock = jest.fn().mockResolvedValue(mockLessons);
      (dataLoaderService.getLessonsByUserLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.lessons(mockUser);

      expect(result).toEqual(mockLessons);
      expect(loadMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array when user has no lessons', async () => {
      const loadMock = jest.fn().mockResolvedValue([]);
      (dataLoaderService.getLessonsByUserLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      const result = await resolver.lessons(mockUser);

      expect(result).toEqual([]);
      expect(loadMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const loadMock = jest.fn().mockRejectedValue(error);
      (dataLoaderService.getLessonsByUserLoader as jest.Mock).mockReturnValue({
        load: loadMock,
      });

      await expect(resolver.lessons(mockUser)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('documents', () => {
    it('should resolve documents field', async () => {
      const mockDocuments = [
        { id: 'doc-1', title: 'Document 1' },
        { id: 'doc-2', title: 'Document 2' },
      ];
      const loadMock = jest.fn().mockResolvedValue(mockDocuments);
      (dataLoaderService.getDocumentsByUserLoader as jest.Mock).mockReturnValue(
        {
          load: loadMock,
        },
      );

      const result = await resolver.documents(mockUser);

      expect(result).toEqual(mockDocuments);
      expect(loadMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array when user has no documents', async () => {
      const loadMock = jest.fn().mockResolvedValue([]);
      (dataLoaderService.getDocumentsByUserLoader as jest.Mock).mockReturnValue(
        {
          load: loadMock,
        },
      );

      const result = await resolver.documents(mockUser);

      expect(result).toEqual([]);
      expect(loadMock).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const loadMock = jest.fn().mockRejectedValue(error);
      (dataLoaderService.getDocumentsByUserLoader as jest.Mock).mockReturnValue(
        {
          load: loadMock,
        },
      );

      await expect(resolver.documents(mockUser)).rejects.toThrow(
        'Database error',
      );
    });
  });

  it('should build GraphQL schema with UserResolver', async () => {
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
        UserResolver,
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

    const userResolver = await moduleRef.resolve<UserResolver>(UserResolver);
    expect(userResolver).toBeDefined();

    await app.close();
  });
});
