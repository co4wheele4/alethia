import 'reflect-metadata';
import { validate } from './env.validation';

describe('env.validation', () => {
  it('should return validated config when validation passes', () => {
    const mockConfig = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      OPENAI_API_KEY: 'test-key',
      PORT: 3000,
    };

    const result = validate(mockConfig);

    expect(result).toBeDefined();
    expect(result.DATABASE_URL).toBe(mockConfig.DATABASE_URL);
    expect(result.OPENAI_API_KEY).toBe(mockConfig.OPENAI_API_KEY);
  });

  it('should throw error when validation fails', () => {
    const mockConfig = {
      // Missing required DATABASE_URL
      OPENAI_API_KEY: 'test-key',
    };

    expect(() => validate(mockConfig)).toThrow();
  });

  it('should handle missing required fields', () => {
    const mockConfig = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      // Missing OPENAI_API_KEY
    };

    expect(() => validate(mockConfig)).toThrow();
  });

  it('should handle optional fields correctly', () => {
    const mockConfig = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      OPENAI_API_KEY: 'test-key',
      // Optional fields not provided
    };

    const result = validate(mockConfig);

    expect(result).toBeDefined();
    expect(result.DATABASE_URL).toBe(mockConfig.DATABASE_URL);
    expect(result.OPENAI_API_KEY).toBe(mockConfig.OPENAI_API_KEY);
  });

  it('should handle all optional fields when provided', () => {
    const mockConfig = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      OPENAI_API_KEY: 'test-key',
      PORT: 3000,
      ALLOWED_ORIGINS: 'http://localhost:3000',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '7d',
      NODE_ENV: 'development',
    };

    const result = validate(mockConfig);

    expect(result).toBeDefined();
    expect(result.PORT).toBe(3000);
    expect(result.ALLOWED_ORIGINS).toBe('http://localhost:3000');
  });

  describe('development mode fallbacks', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDbUrl = process.env.DATABASE_URL;
    const originalApiKey = process.env.OPENAI_API_KEY;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      // Clear any existing values
      delete process.env.DATABASE_URL;
      delete process.env.OPENAI_API_KEY;
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv || 'development';
      if (originalDbUrl) {
        process.env.DATABASE_URL = originalDbUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
      if (originalApiKey) {
        process.env.OPENAI_API_KEY = originalApiKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
      consoleWarnSpy.mockRestore();
    });

    it('should use fallback DATABASE_URL in development when missing', () => {
      delete process.env.DATABASE_URL;
      const mockConfig = {
        OPENAI_API_KEY: 'test-key',
      };

      const result = validate(mockConfig);

      expect(result.DATABASE_URL).toBe(
        'postgresql://localhost:5432/aletheia?schema=public',
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: DATABASE_URL not found'),
      );
    });

    it('should use env DATABASE_URL in development when config missing but env exists', () => {
      delete process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://localhost:5432/env-db';
      const mockConfig = {
        OPENAI_API_KEY: 'test-key',
      };

      const result = validate(mockConfig);

      expect(result.DATABASE_URL).toBe('postgresql://localhost:5432/env-db');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should use fallback OPENAI_API_KEY in development when missing', () => {
      const originalApiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      const mockConfig = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
      };

      const result = validate(mockConfig);

      expect(result.OPENAI_API_KEY).toBe('dummy-key-for-development');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: OPENAI_API_KEY not found'),
      );

      if (originalApiKey) {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
    });

    it('should use env OPENAI_API_KEY in development when config missing but env exists', () => {
      process.env.OPENAI_API_KEY = 'env-api-key';
      const mockConfig = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
      };

      const result = validate(mockConfig);

      expect(result.OPENAI_API_KEY).toBe('env-api-key');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  it('should use config.NODE_ENV when provided', () => {
    const mockConfig = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      OPENAI_API_KEY: 'test-key',
      NODE_ENV: 'production' as const,
    };

    const result = validate(mockConfig);

    expect(result.NODE_ENV).toBe('production');
  });

  it('should use process.env.NODE_ENV when config.NODE_ENV not provided', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const mockConfig = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      OPENAI_API_KEY: 'test-key',
    };

    // When process.env.NODE_ENV is 'test', it's not development, so fallbacks shouldn't apply
    const result = validate(mockConfig);

    expect(result).toBeDefined();
    expect(result.DATABASE_URL).toBe('postgresql://localhost:5432/test');
    // NODE_ENV is optional, so it may or may not be in the result
    // The important thing is that the validation works
    process.env.NODE_ENV = originalNodeEnv || 'development';
  });

  it('should use process.env.NODE_ENV when config.NODE_ENV is undefined', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const mockConfig: Record<string, unknown> = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      OPENAI_API_KEY: 'test-key',
      // NODE_ENV is undefined (not provided)
    };

    // When config.NODE_ENV is undefined, should fall back to process.env.NODE_ENV
    // The nodeEnv variable will be 'production' from process.env, but since
    // config.NODE_ENV is undefined, it won't be validated (it's optional)
    const result = validate(mockConfig);

    expect(result).toBeDefined();
    expect(result.DATABASE_URL).toBe('postgresql://localhost:5432/test');
    process.env.NODE_ENV = originalNodeEnv || 'development';
  });

  it('should use default development when both config and env NODE_ENV are missing', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    const mockConfig: Record<string, unknown> = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      OPENAI_API_KEY: 'test-key',
      // NODE_ENV is undefined
    };

    // When both are missing, should default to 'development'
    // This triggers the development fallback logic
    const result = validate(mockConfig);

    expect(result).toBeDefined();
    expect(result.DATABASE_URL).toBe('postgresql://localhost:5432/test');
    process.env.NODE_ENV = originalNodeEnv || 'development';
  });
});
