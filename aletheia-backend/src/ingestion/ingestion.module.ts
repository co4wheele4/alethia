import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { ExtractionService } from './extraction.service';
import { IngestionResolver } from './ingestion.resolver';
import { PrismaService } from '@prisma/prisma.service';

@Module({
  providers: [
    IngestionService,
    ExtractionService,
    IngestionResolver,
    PrismaService,
  ],
  exports: [IngestionService, ExtractionService],
})
export class IngestionModule {}
