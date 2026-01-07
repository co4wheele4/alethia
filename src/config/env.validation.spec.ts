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
});

