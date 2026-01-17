import { Test } from '@nestjs/testing';
import { IngestionModule } from './ingestion.module';
import { IngestionService } from './ingestion.service';
import { ExtractionService } from './extraction.service';
import { IngestionResolver } from './ingestion.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { OpenAIService } from '../openai/openai.service';
import { ConfigService } from '@nestjs/config';
import { OpenAIModule } from '../openai/openai.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

describe('IngestionModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [
        IngestionModule,
        OpenAIModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(OpenAIService)
      .useValue({})
      .overrideProvider(ConfigService)
      .useValue({ get: jest.fn().mockReturnValue('mock-api-key') })
      .compile();

    const app = module.createNestApplication();
    await app.init();

    expect(module).toBeDefined();
    expect(module.get(IngestionService)).toBeDefined();
    expect(module.get(ExtractionService)).toBeDefined();
    expect(module.get(IngestionResolver)).toBeDefined();

    await app.close();
  });

  describe('OpenAI module', () => {
    it('should be defined', async () => {
      const module = await Test.createTestingModule({
        imports: [OpenAIModule],
      })
        .overrideProvider(ConfigService)
        .useValue({ get: jest.fn().mockReturnValue('mock-api-key') })
        .compile();
      expect(module.get(OpenAIService)).toBeDefined();
    });
  });
});
