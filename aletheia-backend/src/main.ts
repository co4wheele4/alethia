import 'tsconfig-paths/register'; // enable path aliases
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { PrismaExceptionFilter, HttpExceptionFilter } from './common/filters';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Log database connection info
  const dbUrl = process.env.DATABASE_URL || '';
  const dbMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbMatch ? dbMatch[1] : 'unknown';
  console.log(`🗄️  Database: ${dbName}`);

  // Security headers - configure helmet to allow GraphQL Playground
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? undefined
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'", // Required for GraphQL Playground
                'https://cdn.jsdelivr.net', // GraphQL Playground scripts
                'http://cdn.jsdelivr.net', // Some resources use HTTP
              ],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://cdn.jsdelivr.net', // GraphQL Playground styles
                'http://cdn.jsdelivr.net', // Some resources use HTTP
                'https://fonts.googleapis.com', // Google Fonts stylesheets
              ],
              imgSrc: [
                "'self'",
                'data:',
                'https://cdn.jsdelivr.net', // GraphQL Playground images (HTTPS)
                'http://cdn.jsdelivr.net', // GraphQL Playground images (HTTP)
              ],
              connectSrc: [
                "'self'",
                'https://cdn.jsdelivr.net', // GraphQL Playground connections
                'http://cdn.jsdelivr.net', // Some resources use HTTP
                'ws://localhost:3000', // WebSocket for Playground
                'ws://localhost:3001',
                'http://localhost:3000', // Local connections
                'http://localhost:3001',
              ],
              fontSrc: [
                "'self'",
                'https://cdn.jsdelivr.net',
                'http://cdn.jsdelivr.net',
                'https://fonts.gstatic.com', // Google Fonts
                'https://fonts.googleapis.com', // Google Fonts
              ],
            },
          },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS configuration — merge env with dev defaults so ALLOWED_ORIGINS in .env does not drop loopback
  // (Playwright + run-demo-headed use http://127.0.0.1:3030+; CORS Origin must match the page host exactly).
  const loopbackFrontendOrigins = Array.from(
    { length: 19 },
    (_, i) => `http://127.0.0.1:${3030 + i}`,
  );
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3030',
    'http://127.0.0.1:3040',
    'http://localhost:3040',
    ...loopbackFrontendOrigins,
  ];
  const fromEnv = process.env.ALLOWED_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const allowedOrigins = [...new Set([...(fromEnv ?? []), ...defaultOrigins])];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filters
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`NestJS app running on http://localhost:${port}`);
  console.log(`GraphQL Playground: http://localhost:${port}/graphql`);
}

void bootstrap();
