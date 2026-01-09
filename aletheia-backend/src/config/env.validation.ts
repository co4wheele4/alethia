import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  OPENAI_API_KEY!: string;

  @IsOptional()
  @IsNumber()
  PORT?: number;

  @IsOptional()
  @IsString()
  ALLOWED_ORIGINS?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsIn([Environment.Development, Environment.Production, Environment.Test])
  NODE_ENV?: Environment;
}

export function validate(config: Record<string, unknown>) {
  const nodeEnv =
    (config.NODE_ENV as string) || process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';

  // Provide default values for development if missing (fallbacks only)
  // These should NEVER be used in production - .env file is required
  if (isDevelopment) {
    if (!config.DATABASE_URL) {
      const envDbUrl = process.env.DATABASE_URL;
      if (!envDbUrl) {
        console.warn(
          '⚠️  WARNING: DATABASE_URL not found in environment variables.\n' +
            '   Using fallback. Please create .env file with proper DATABASE_URL.',
        );
      }
      config.DATABASE_URL =
        envDbUrl || 'postgresql://localhost:5432/aletheia?schema=public';
    }
    if (!config.OPENAI_API_KEY) {
      const envOpenAIApiKey = process.env.OPENAI_API_KEY;
      if (!envOpenAIApiKey) {
        console.warn(
          '⚠️  WARNING: OPENAI_API_KEY not found in environment variables.\n' +
            '   Using dummy key for development. Please create .env file with proper OPENAI_API_KEY.',
        );
      }
      config.OPENAI_API_KEY = envOpenAIApiKey || 'dummy-key-for-development';
    }
  }

  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
