import { Test } from '@nestjs/testing';
import { DataLoaderModule } from './dataloader.module';
import { DataLoaderService } from './dataloader.service';
import { PrismaService } from '@prisma/prisma.service';

describe('DataLoaderModule', () => {
  let moduleRef: Awaited<
    ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
  >;

  beforeEach(async () => {
    // Prisma 7 runtime requires an explicit datasourceUrl; unit tests should not connect,
    // but PrismaService must be constructible for module compilation.
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ||
      'postgresql://user:password@localhost:5432/aletheia_test';

    moduleRef = await Test.createTestingModule({
      imports: [DataLoaderModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should provide DataLoaderService', async () => {
    const service =
      await moduleRef.resolve<DataLoaderService>(DataLoaderService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(DataLoaderService);
  });

  it('should provide PrismaService', () => {
    const service = moduleRef.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
  });

  it('should export DataLoaderService', async () => {
    const service =
      await moduleRef.resolve<DataLoaderService>(DataLoaderService);
    expect(service).toBeDefined();
  });
});
