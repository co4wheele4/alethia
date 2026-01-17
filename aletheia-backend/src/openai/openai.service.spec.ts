import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import OpenAI from 'openai';
import { createHash } from 'node:crypto';

// Mock OpenAI
jest.mock('openai');

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockEmbeddingResponse = {
    data: [
      {
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        index: 0,
        object: 'embedding',
      },
    ],
    model: 'text-embedding-3-large',
    object: 'list',
    usage: {
      prompt_tokens: 5,
      total_tokens: 5,
    },
  };

  beforeEach(async () => {
    // Reset environment
    process.env.OPENAI_API_KEY = 'test-api-key';

    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [OpenAIService],
    }).compile();

    service = moduleRef.get<OpenAIService>(OpenAIService);
    mockOpenAI = (OpenAI as unknown as jest.MockedClass<typeof OpenAI>).mock
      .instances[0] as jest.Mocked<OpenAI>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize OpenAI client with API key', () => {
    expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
  });

  it('should throw error when OPENAI_API_KEY is missing', async () => {
    await expect(async () => {
      const moduleRef: Awaited<
        ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
      > = await Test.createTestingModule({
        providers: [
          OpenAIService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'OPENAI_API_KEY') {
                  return undefined;
                }
                return undefined;
              }),
            },
          },
        ],
      }).compile();
      moduleRef.get<OpenAIService>(OpenAIService);
    }).rejects.toThrow(
      'OPENAI_API_KEY is required but not found in environment variables',
    );
  });

  describe('getEmbeddingResult', () => {
    it('should return embedding vector as JSON string', async () => {
      const createMock = jest.fn().mockResolvedValue(mockEmbeddingResponse);
      mockOpenAI.embeddings = {
        create: createMock,
      } as unknown as typeof mockOpenAI.embeddings;

      const result = await service.getEmbeddingResult('test prompt');

      expect(createMock).toHaveBeenCalledWith({
        model: 'text-embedding-3-large',
        input: 'test prompt',
      });
      expect(result).toBe(
        JSON.stringify(mockEmbeddingResponse.data[0].embedding),
      );
    });

    it('should handle errors gracefully', async () => {
      const createMock = jest.fn().mockRejectedValue(new Error('API Error'));
      mockOpenAI.embeddings = {
        create: createMock,
      } as unknown as typeof mockOpenAI.embeddings;

      await expect(service.getEmbeddingResult('test prompt')).rejects.toThrow(
        'API Error',
      );
    });

    it('should return deterministic placeholder when network is disabled', async () => {
      const originalDisable = process.env.OPENAI_DISABLE_NETWORK;
      process.env.OPENAI_DISABLE_NETWORK = 'true';
      process.env.OPENAI_API_KEY = 'test-api-key';

      const moduleRef: Awaited<
        ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
      > = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
          }),
        ],
        providers: [OpenAIService],
      }).compile();

      const svc = moduleRef.get<OpenAIService>(OpenAIService);
      const instances = (OpenAI as unknown as jest.MockedClass<typeof OpenAI>)
        .mock.instances as unknown as jest.Mocked<OpenAI>[];
      const instance = instances[instances.length - 1];

      const createMock = jest.fn();
      instance.embeddings = { create: createMock } as any;

      const prompt = 'hello';
      const result = await svc.getEmbeddingResult(prompt);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        kind: 'embedding-placeholder',
        sha256_16: createHash('sha256')
          .update(prompt)
          .digest('hex')
          .slice(0, 16),
        length: prompt.length,
      });
      expect(createMock).not.toHaveBeenCalled();

      process.env.OPENAI_DISABLE_NETWORK = originalDisable;
      await moduleRef.close();
    });
  });

  describe('ask', () => {
    it('should call chat.completions.create with prompt', async () => {
      const mockChatResponse = {
        choices: [{ message: { content: 'AI Answer' } }],
      };
      const createMock = jest.fn().mockResolvedValue(mockChatResponse);
      mockOpenAI.chat = {
        completions: {
          create: createMock,
        },
      } as any;

      const result = await service.ask('test prompt');

      expect(createMock).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'test prompt' }],
      });
      expect(result).toBe('AI Answer');
    });

    it('should return placeholder when network is disabled', async () => {
      // Create a service with network disabled
      const originalDisable = process.env.OPENAI_DISABLE_NETWORK;
      process.env.OPENAI_DISABLE_NETWORK = 'true';

      const moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ isGlobal: true })],
        providers: [OpenAIService],
      }).compile();
      const svc = moduleRef.get<OpenAIService>(OpenAIService);

      const result = await svc.ask('test prompt');
      expect(result).toBe('AI Response Placeholder');

      process.env.OPENAI_DISABLE_NETWORK = originalDisable;
    });

    it('should handle empty content in response', async () => {
      const mockChatResponse = {
        choices: [{ message: { content: null } }],
      };
      const createMock = jest.fn().mockResolvedValue(mockChatResponse);
      mockOpenAI.chat = {
        completions: {
          create: createMock,
        },
      } as any;

      const result = await service.ask('test prompt');
      expect(result).toBe('');
    });
  });

  describe('extract', () => {
    it('should call chat.completions.create with json mode and prompt', async () => {
      const mockResult = { entities: [], relationships: [] };
      const mockChatResponse = {
        choices: [{ message: { content: JSON.stringify(mockResult) } }],
      };
      const createMock = jest.fn().mockResolvedValue(mockChatResponse);
      mockOpenAI.chat = {
        completions: {
          create: createMock,
        },
      } as any;

      const result = await service.extract('test prompt');

      expect(createMock).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'test prompt' }],
        response_format: { type: 'json_object' },
      });
      expect(result).toEqual(mockResult);
    });

    it('should return empty suggestions when network is disabled', async () => {
      const originalDisable = process.env.OPENAI_DISABLE_NETWORK;
      process.env.OPENAI_DISABLE_NETWORK = 'true';

      const moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ isGlobal: true })],
        providers: [OpenAIService],
      }).compile();
      const svc = moduleRef.get<OpenAIService>(OpenAIService);

      const result = await svc.extract('test prompt');
      expect(result).toEqual({ suggestions: [] });

      process.env.OPENAI_DISABLE_NETWORK = originalDisable;
    });

    it('should handle empty response content', async () => {
      const mockChatResponse = {
        choices: [{ message: { content: null } }],
      };
      const createMock = jest.fn().mockResolvedValue(mockChatResponse);
      mockOpenAI.chat = {
        completions: {
          create: createMock,
        },
      } as any;

      const result = await service.extract('test prompt');
      expect(result).toEqual({});
    });
  });
});
