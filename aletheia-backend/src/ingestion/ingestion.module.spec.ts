import { Test } from '@nestjs/testing';
import { IngestionModule } from './ingestion.module';
import { IngestionService } from './ingestion.service';
import { IngestionResolver } from './ingestion.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

describe('IngestionModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [
        IngestionModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const app = module.createNestApplication();
    await app.init();

    expect(module).toBeDefined();
    expect(module.get(IngestionService)).toBeDefined();
    expect(module.get(IngestionResolver)).toBeDefined();

    await app.close();
  });
});
