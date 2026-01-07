import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

// Mock NestFactory before importing main
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

// Mock helmet
jest.mock('helmet', () => {
  return jest.fn(
    () => (_req: unknown, _res: unknown, next: () => void) => next(),
  );
});

// Mock console.log
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

interface MockApp {
  listen: jest.Mock;
  use: jest.Mock;
  enableCors: jest.Mock;
  useGlobalPipes: jest.Mock;
  useGlobalFilters: jest.Mock;
}

describe('main.ts', () => {
  let mockApp: MockApp;

  beforeEach(() => {
    mockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
      use: jest.fn().mockReturnThis(),
      enableCors: jest.fn().mockReturnThis(),
      useGlobalPipes: jest.fn().mockReturnThis(),
      useGlobalFilters: jest.fn().mockReturnThis(),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    // Ensure PORT is not set (use default)
    delete process.env.PORT;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.PORT;
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it('should bootstrap the application', async () => {
    // Dynamically import main to execute bootstrap
    await import('./main');

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(mockApp.use).toHaveBeenCalled(); // helmet
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
    expect(mockApp.useGlobalFilters).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith(3000); // default port
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('NestJS app running on http://localhost:3000'),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'GraphQL Playground: http://localhost:3000/graphql',
      ),
    );
  });

  it('should use ALLOWED_ORIGINS from environment when set', async () => {
    const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;
    process.env.ALLOWED_ORIGINS = 'http://example.com,http://test.com';

    // Create a new mock app for this test
    const testMockApp: MockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
      use: jest.fn().mockReturnThis(),
      enableCors: jest.fn().mockReturnThis(),
      useGlobalPipes: jest.fn().mockReturnThis(),
      useGlobalFilters: jest.fn().mockReturnThis(),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(testMockApp);

    // Clear module cache to re-import
    jest.resetModules();
    
    // Re-import mocks
    jest.doMock('@nestjs/core', () => ({
      NestFactory: {
        create: jest.fn().mockResolvedValue(testMockApp),
      },
    }));
    
    await import('./main');

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(testMockApp.enableCors).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: ['http://example.com', 'http://test.com'],
      }),
    );

    // Restore
    if (originalAllowedOrigins) {
      process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
    } else {
      delete process.env.ALLOWED_ORIGINS;
    }
  });

  it('should use custom PORT from environment when set', async () => {
    const originalPort = process.env.PORT;
    process.env.PORT = '4000';

    // Create a new mock app for this test
    const testMockApp: MockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
      use: jest.fn().mockReturnThis(),
      enableCors: jest.fn().mockReturnThis(),
      useGlobalPipes: jest.fn().mockReturnThis(),
      useGlobalFilters: jest.fn().mockReturnThis(),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(testMockApp);

    // Clear module cache to re-import
    jest.resetModules();
    
    // Re-import mocks
    jest.doMock('@nestjs/core', () => ({
      NestFactory: {
        create: jest.fn().mockResolvedValue(testMockApp),
      },
    }));
    
    await import('./main');

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(testMockApp.listen).toHaveBeenCalledWith('4000');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('NestJS app running on http://localhost:4000'),
    );

    // Restore
    if (originalPort) {
      process.env.PORT = originalPort;
    } else {
      delete process.env.PORT;
    }
  });
});
