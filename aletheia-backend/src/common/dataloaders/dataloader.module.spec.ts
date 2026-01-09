import { Test, TestingModule } from '@nestjs/testing';
import { DataLoaderModule } from './dataloader.module';
import { DataLoaderService } from './dataloader.service';
import { PrismaService } from '@prisma/prisma.service';

describe('DataLoaderModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DataLoaderModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide DataLoaderService', async () => {
    const service = await module.resolve<DataLoaderService>(DataLoaderService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(DataLoaderService);
  });

  it('should provide PrismaService', () => {
    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
  });

  it('should export DataLoaderService', async () => {
    const service = await module.resolve<DataLoaderService>(DataLoaderService);
    expect(service).toBeDefined();
  });
});
