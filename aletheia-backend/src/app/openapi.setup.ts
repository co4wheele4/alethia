import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * REST/OpenAPI catalog (Swagger UI). Primary product API remains GraphQL at POST /graphql.
 */
export function configureOpenApi(app: INestApplication): void {
  const swaggerDescription = [
    '**Aletheia** — OpenAPI catalog for **small REST** routes (health, root).',
    '',
    '### GraphQL (primary API)',
    '- **Endpoint:** `POST /graphql`',
    '- **Playground (dev):** `GET /graphql` when `NODE_ENV` is not `production`',
    '- **Schema file (repo):** `aletheia-backend/src/schema.gql` (generated; checked in for review)',
    '- **Auth:** `Authorization: Bearer <JWT>` for protected operations',
  ].join('\n');

  const config = new DocumentBuilder()
    .setTitle('Aletheia API')
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
      },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api/json',
    yamlDocumentUrl: 'api/yaml',
  });
}
