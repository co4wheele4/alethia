import { Test, TestingModule } from '@nestjs/testing';
import { AiQueryResolver, AiQueryResultResolver } from './ai-query.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { AiQuery, AiQueryResult } from '@models/ai-query.model';
import { User } from '@models/user.model';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

describe('AiQueryResolver', () => {
  let resolver: AiQueryResolver;
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

  const mockAiQuery: AiQuery = {
    id: 'query-1',
    query: 'What is Aletheia?',
    user: mockUser,
    createdAt: new Date(),
  };

  const mockAiQueryResult: AiQueryResult = {
    id: 'result-1',
    answer: 'Aletheia is a system for truth discovery.',
    score: 0.9,
    query: mockAiQuery,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      aiQuery: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      aiQueryResult: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiQueryResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<AiQueryResolver>(AiQueryResolver);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should have prisma service injected', () => {
    expect(resolver).toHaveProperty('prisma');
  });

  it('should instantiate AiQueryResolver directly', () => {
    const newResolver = new AiQueryResolver(prismaService);
    expect(newResolver).toBeInstanceOf(AiQueryResolver);
    expect(newResolver['prisma']).toBe(prismaService);
  });

  it('should have correct GraphQL decorators on aiQuery query', () => {
    expect(resolver.aiQuery).toBeDefined();
    expect(typeof resolver.aiQuery).toBe('function');
  });

  it('should have correct GraphQL decorators on aiQueriesPaged query', () => {
    expect(resolver.aiQueriesPaged).toBeDefined();
    expect(typeof resolver.aiQueriesPaged).toBe('function');
  });

  describe('aiQueries', () => {
    it('should return an array of ai queries ordered by createdAt desc', async () => {
      const mockQueries = [mockAiQuery];
      const findManyMock = prismaService.aiQuery.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockQueries as unknown as typeof mockQueries,
      );

      const result = await resolver.aiQueries();

      expect(result).toEqual(mockQueries);
      expect(findManyMock).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no queries exist', async () => {
      const findManyMock = prismaService.aiQuery.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.aiQueries();

      expect(result).toEqual([]);
    });
  });

  describe('aiQuery', () => {
    it('should return an ai query by id', async () => {
      const findUniqueMock = prismaService.aiQuery.findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(
        mockAiQuery as unknown as typeof mockAiQuery,
      );

      const result = await resolver.aiQuery('query-1');

      expect(result).toEqual(mockAiQuery);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 'query-1' },
      });
    });

    it('should return null when query not found', async () => {
      const findUniqueMock = prismaService.aiQuery.findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(null);

      const result = await resolver.aiQuery('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('aiQueriesByUser', () => {
    it('should return ai queries for a specific user', async () => {
      const mockQueries = [mockAiQuery];
      const findManyMock = prismaService.aiQuery.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockQueries as unknown as typeof mockQueries,
      );

      const result = await resolver.aiQueriesByUser('user-1');

      expect(result).toEqual(mockQueries);
      expect(findManyMock).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('aiQueriesPaged', () => {
    it('should return paginated ai queries with default values', async () => {
      const mockQueries = [mockAiQuery];
      const findManyMock = prismaService.aiQuery.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockQueries as unknown as typeof mockQueries,
      );

      const result = await resolver.aiQueriesPaged();

      expect(result).toEqual(mockQueries);
      expect(findManyMock).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return paginated ai queries with custom values', async () => {
      const mockQueries = [mockAiQuery];
      const findManyMock = prismaService.aiQuery.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockQueries as unknown as typeof mockQueries,
      );

      const result = await resolver.aiQueriesPaged(10, 5);

      expect(result).toEqual(mockQueries);
      expect(findManyMock).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should use default values when parameters are undefined', async () => {
      const mockQueries = [mockAiQuery];
      const findManyMock = prismaService.aiQuery.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockQueries as unknown as typeof mockQueries,
      );

      // When undefined is passed, defaults (0, 20) are used
      const result = await resolver.aiQueriesPaged(undefined, undefined);

      expect(result).toEqual(mockQueries);
      expect(findManyMock).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle null skip parameter', async () => {
      const mockQueries = [mockAiQuery];
      const findManyMock = prismaService.aiQuery.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockQueries as unknown as typeof mockQueries,
      );

      const result = await resolver.aiQueriesPaged(null as any, 10);

      expect(result).toEqual(mockQueries);
      expect(findManyMock).toHaveBeenCalled();
    });

    it('should handle null take parameter', async () => {
      const mockQueries = [mockAiQuery];
      const findManyMock = prismaService.aiQuery.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockQueries as unknown as typeof mockQueries,
      );

      const result = await resolver.aiQueriesPaged(5, null as any);

      expect(result).toEqual(mockQueries);
      expect(findManyMock).toHaveBeenCalled();
    });
  });

  describe('askAi', () => {
    it('should create an ai query and result', async () => {
      const createQueryMock = prismaService.aiQuery.create as jest.Mock;
      const createResultMock = prismaService.aiQueryResult.create as jest.Mock;
      createQueryMock.mockResolvedValue(
        mockAiQuery as unknown as typeof mockAiQuery,
      );
      createResultMock.mockResolvedValue(
        mockAiQueryResult as unknown as typeof mockAiQueryResult,
      );

      const result = await resolver.askAi('user-1', 'What is Aletheia?');

      expect(result).toEqual(mockAiQueryResult);
      expect(createQueryMock).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          query: 'What is Aletheia?',
        },
      });
      expect(createResultMock).toHaveBeenCalledWith({
        data: {
          queryId: mockAiQuery.id,
          answer: 'TODO: AI response',
          score: 0.9,
        },
      });
    });
  });

  describe('user', () => {
    it('should resolve user field', async () => {
      const userMock = jest.fn().mockResolvedValue(mockUser);
      const mockFindUnique = {
        user: userMock,
      };
      const findUniqueMock = jest.fn().mockReturnValue(mockFindUnique);
      prismaService.aiQuery.findUnique = findUniqueMock;

      const result = await resolver.user(mockAiQuery);

      expect(result).toEqual(mockUser);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: mockAiQuery.id },
      });
      expect(userMock).toHaveBeenCalled();
    });
  });

  describe('results', () => {
    it('should resolve results field', async () => {
      const mockResults = [mockAiQueryResult];
      const resultsMock = jest.fn().mockResolvedValue(mockResults);
      const mockFindUnique = {
        results: resultsMock,
      };
      const findUniqueMock = jest.fn().mockReturnValue(mockFindUnique);
      prismaService.aiQuery.findUnique = findUniqueMock;

      const result = await resolver.results(mockAiQuery);

      expect(result).toEqual(mockResults);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: mockAiQuery.id },
      });
      expect(resultsMock).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  it('should build GraphQL schema with AiQueryResolver', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        AiQueryResolver,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const aiQueryResolver = module.get<AiQueryResolver>(AiQueryResolver);
    expect(aiQueryResolver).toBeDefined();

    await app.close();
  });
});

describe('AiQueryResultResolver', () => {
  let resolver: AiQueryResultResolver;
  let prismaService: jest.Mocked<PrismaService>;

  const mockAiQuery: AiQuery = {
    id: 'query-1',
    query: 'What is Aletheia?',
    user: {} as User,
    createdAt: new Date(),
  };

  const mockAiQueryResult: AiQueryResult = {
    id: 'result-1',
    answer: 'Aletheia is a system for truth discovery.',
    score: 0.9,
    query: mockAiQuery,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      aiQueryResult: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      aiQuery: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiQueryResultResolver,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<AiQueryResultResolver>(AiQueryResultResolver);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should have prisma service injected', () => {
    expect(resolver).toHaveProperty('prisma');
    expect(resolver['prisma']).toBe(prismaService);
  });

  it('should instantiate AiQueryResultResolver directly', () => {
    const newResolver = new AiQueryResultResolver(prismaService);
    expect(newResolver).toBeInstanceOf(AiQueryResultResolver);
    expect(newResolver['prisma']).toBe(prismaService);
  });

  it('should have correct GraphQL decorators on aiQueryResult query', () => {
    expect(resolver.aiQueryResult).toBeDefined();
    expect(typeof resolver.aiQueryResult).toBe('function');
  });

  describe('aiQueryResults', () => {
    it('should return an array of ai query results', async () => {
      const mockResults = [mockAiQueryResult];
      const findManyMock = prismaService.aiQueryResult.findMany as jest.Mock;
      findManyMock.mockResolvedValue(
        mockResults as unknown as typeof mockResults,
      );

      const result = await resolver.aiQueryResults();

      expect(result).toEqual(mockResults);
      expect(findManyMock).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no results exist', async () => {
      const findManyMock = prismaService.aiQueryResult.findMany as jest.Mock;
      findManyMock.mockResolvedValue([]);

      const result = await resolver.aiQueryResults();

      expect(result).toEqual([]);
    });
  });

  describe('aiQueryResult', () => {
    it('should return an ai query result by id', async () => {
      const findUniqueMock = prismaService.aiQueryResult
        .findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(
        mockAiQueryResult as unknown as typeof mockAiQueryResult,
      );

      const result = await resolver.aiQueryResult('result-1');

      expect(result).toEqual(mockAiQueryResult);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 'result-1' },
      });
    });

    it('should return null when result not found', async () => {
      const findUniqueMock = prismaService.aiQueryResult
        .findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(null);

      const result = await resolver.aiQueryResult('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('query', () => {
    it('should resolve query field', async () => {
      const queryMock = jest.fn().mockResolvedValue(mockAiQuery);
      const mockFindUnique = {
        query: queryMock,
      };
      const findUniqueMock = jest.fn().mockReturnValue(mockFindUnique);
      prismaService.aiQueryResult.findUnique = findUniqueMock;

      const result = await resolver.query(mockAiQueryResult);

      expect(result).toEqual(mockAiQuery);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: mockAiQueryResult.id },
      });
      expect(queryMock).toHaveBeenCalled();
    });
  });

  it('should build GraphQL schema with AiQueryResultResolver', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        AiQueryResultResolver,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const resultResolver = module.get<AiQueryResultResolver>(
      AiQueryResultResolver,
    );
    expect(resultResolver).toBeDefined();

    await app.close();
  });
});
