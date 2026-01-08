import { Module, Global } from '@nestjs/common';
import { DataLoaderService } from './dataloader.service';
import { PrismaService } from '@prisma/prisma.service';

@Global()
@Module({
  providers: [DataLoaderService, PrismaService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {}

