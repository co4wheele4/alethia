import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = moduleRef.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up any test data if needed
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend PrismaClient', () => {
    // PrismaService extends PrismaClient
    expect(service).toBeDefined();
    expect(service).toHaveProperty('$connect');
    expect(service).toHaveProperty('$disconnect');
  });

  describe('onModuleInit', () => {
    it('should connect to database', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Connecting to database: test');
      expect(logSpy).toHaveBeenCalledWith(
        'Successfully connected to database: test',
      );
      connectSpy.mockRestore();
      logSpy.mockRestore();
      process.env.DATABASE_URL = originalDbUrl;
    });

    it('should handle malformed DATABASE_URL gracefully', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'invalid-url';

      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Connecting to database: unknown');
      expect(logSpy).toHaveBeenCalledWith(
        'Successfully connected to database: unknown',
      );
      connectSpy.mockRestore();
      logSpy.mockRestore();
      process.env.DATABASE_URL = originalDbUrl;
    });

    it('should handle empty DATABASE_URL gracefully', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();
      const originalDbUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Connecting to database: unknown');
      connectSpy.mockRestore();
      logSpy.mockRestore();
      process.env.DATABASE_URL = originalDbUrl;
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue();
      await service.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalled();
      disconnectSpy.mockRestore();
    });
  });
});
