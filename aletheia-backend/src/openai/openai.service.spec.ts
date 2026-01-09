import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import OpenAI from 'openai';

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

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [OpenAIService],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
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
      const module: TestingModule = await Test.createTestingModule({
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
      module.get<OpenAIService>(OpenAIService);
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
  });

  describe('ask', () => {
    it('should call getEmbeddingResult', async () => {
      const createMock = jest.fn().mockResolvedValue(mockEmbeddingResponse);
      mockOpenAI.embeddings = {
        create: createMock,
      } as unknown as typeof mockOpenAI.embeddings;

      const getEmbeddingResultSpy = jest.spyOn(service, 'getEmbeddingResult');
      await service.ask('test prompt');

      expect(getEmbeddingResultSpy).toHaveBeenCalledWith('test prompt');
    });
  });
});
