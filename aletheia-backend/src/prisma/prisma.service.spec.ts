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
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

      const localService = new PrismaService();
      const connectSpy = jest.spyOn(localService, '$connect').mockResolvedValue();
      const logSpy = jest
        .spyOn((localService as unknown as { logger: { log: () => void } }).logger, 'log')
        .mockImplementation();

      await localService.onModuleInit();
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
      const originalDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'invalid-url';

      const localService = new PrismaService();
      const connectSpy = jest.spyOn(localService, '$connect').mockResolvedValue();
      const logSpy = jest
        .spyOn((localService as unknown as { logger: { log: () => void } }).logger, 'log')
        .mockImplementation();

      await localService.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Connecting to database: unknown');
      expect(logSpy).toHaveBeenCalledWith(
        'Successfully connected to database: unknown',
      );
      connectSpy.mockRestore();
      logSpy.mockRestore();
      process.env.DATABASE_URL = originalDbUrl;
    });

    it('should throw when DATABASE_URL was missing at service construction', async () => {
      const originalDbUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      const localService = new PrismaService();
      await expect(localService.onModuleInit()).rejects.toThrow(
        'DATABASE_URL is required to initialize PrismaService.',
      );

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
