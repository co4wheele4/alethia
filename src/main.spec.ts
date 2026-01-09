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

  it('should extract database name from valid DATABASE_URL', async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      'postgresql://user:pass@localhost:5432/mydb?schema=public';

    const testMockApp: MockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
      use: jest.fn().mockReturnThis(),
      enableCors: jest.fn().mockReturnThis(),
      useGlobalPipes: jest.fn().mockReturnThis(),
      useGlobalFilters: jest.fn().mockReturnThis(),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(testMockApp);

    jest.resetModules();

    await import('./main');
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database: mydb'),
    );

    process.env.DATABASE_URL = originalDbUrl;
  });

  it('should handle malformed DATABASE_URL gracefully', async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'invalid-url';

    const testMockApp: MockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
      use: jest.fn().mockReturnThis(),
      enableCors: jest.fn().mockReturnThis(),
      useGlobalPipes: jest.fn().mockReturnThis(),
      useGlobalFilters: jest.fn().mockReturnThis(),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(testMockApp);

    jest.resetModules();

    await import('./main');
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database: unknown'),
    );

    process.env.DATABASE_URL = originalDbUrl;
  });

  it('should handle empty DATABASE_URL gracefully', async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    // Explicitly set to empty string to test the || '' fallback
    process.env.DATABASE_URL = '';

    const testMockApp: MockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
      use: jest.fn().mockReturnThis(),
      enableCors: jest.fn().mockReturnThis(),
      useGlobalPipes: jest.fn().mockReturnThis(),
      useGlobalFilters: jest.fn().mockReturnThis(),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(testMockApp);

    jest.resetModules();

    await import('./main');
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database: unknown'),
    );

    if (originalDbUrl) {
      process.env.DATABASE_URL = originalDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it('should configure helmet differently for production vs development', async () => {
    const originalNodeEnv = process.env.NODE_ENV;

    // Test production mode
    process.env.NODE_ENV = 'production';

    // Capture helmet configuration
    let capturedHelmetConfig: unknown;
    const helmetMockFactory = jest.fn((config?: unknown) => {
      capturedHelmetConfig = config;
      return (_req: unknown, _res: unknown, next: () => void) => next();
    });

    const prodMockApp: MockApp = {
      listen: jest.fn().mockResolvedValue(undefined),
      use: jest.fn().mockReturnThis(),
      enableCors: jest.fn().mockReturnThis(),
      useGlobalPipes: jest.fn().mockReturnThis(),
      useGlobalFilters: jest.fn().mockReturnThis(),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(prodMockApp);

    // Reset and re-mock before importing
    jest.resetModules();
    jest.doMock('helmet', () => helmetMockFactory);
    jest.doMock('@nestjs/core', () => ({
      NestFactory: {
        create: jest.fn().mockResolvedValue(prodMockApp),
      },
    }));

    // Import main after setting NODE_ENV to production
    await import('./main');
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Helmet should be called
    expect(prodMockApp.use).toHaveBeenCalled();
    expect(helmetMockFactory).toHaveBeenCalled();
    // In production, CSP should be undefined
    const helmetConfig = capturedHelmetConfig as {
      contentSecurityPolicy?: unknown;
    };
    expect(helmetConfig?.contentSecurityPolicy).toBeUndefined();

    process.env.NODE_ENV = originalNodeEnv;
  });
});
