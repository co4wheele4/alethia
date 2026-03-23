import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { IngestDocumentInput } from '../graphql/inputs/ingest-document.input';
import { createHash } from 'crypto';
import { DocumentSourceKind } from '@prisma/client';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ingest(input: IngestDocumentInput) {
    this.logger.log(`Starting ingestion for document: ${input.title}`);

    // 1. Intake Validation
    this.validateInput(input);

    // 2. Calculate Hash for Idempotency
    const contentSha256 = this.calculateHash(input.content);

    // Check for existing document for idempotency
    const existingSource = await this.prisma.documentSource.findFirst({
      where: {
        contentSha256,
        document: {
          userId: input.userId,
          title: input.title,
        },
      },
      include: { document: true },
    });

    if (existingSource) {
      this.logger.log(
        `Document already exists, returning existing document: ${existingSource.documentId}`,
      );
      return existingSource.document;
    }

    // 3. Raw Storage & Structural Parsing (Transaction)
    return await this.prisma.$transaction(async (tx) => {
      // 3a. Create Document
      const document = await tx.document.create({
        data: {
          title: input.title,
          userId: input.userId,
          sourceType: input.source.kind as DocumentSourceKind,
          sourceLabel:
            input.source.filename || input.source.requestedUrl || input.title,
        },
      });

      // 3b. Create DocumentSource
      await tx.documentSource.create({
        data: {
          documentId: document.id,
          kind: input.source.kind as DocumentSourceKind,
          ingestedAt: new Date(),
          contentSha256,
          filename: input.source.filename,
          mimeType: input.source.mimeType,
          sizeBytes: input.source.sizeBytes,
          lastModifiedMs: input.source.lastModifiedMs
            ? BigInt(input.source.lastModifiedMs)
            : null,
          requestedUrl: input.source.requestedUrl,
          fetchedUrl: input.source.fetchedUrl,
          contentType: input.source.contentType,
          publisher: input.source.publisher,
          author: input.source.author,
          publishedAt: input.source.publishedAt,
          accessedAt: input.source.accessedAt,
        },
      });

      // 4. Structural Parsing
      // Split by form feed (\f) for pages, then by double newlines for paragraphs.
      const chunksData: { content: string; chunkIndex: number }[] = [];
      let currentChunkIndex = 0;

      const pages = input.content.split(/\f/);

      pages.forEach((pageContent) => {
        const paragraphs = pageContent
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        paragraphs.forEach((para) => {
          chunksData.push({
            content: para,
            chunkIndex: currentChunkIndex++,
          });
        });
      });

      if (chunksData.length > 0) {
        await tx.documentChunk.createMany({
          data: chunksData.map((c) => ({
            ...c,
            documentId: document.id,
          })),
        });
      }

      this.logger.log(`Ingestion completed for document: ${document.id}`);
      return document;
    });
  }

  private validateInput(input: IngestDocumentInput) {
    if (!input.content || !/\S/.test(input.content)) {
      throw new BadRequestException('Document content cannot be empty');
    }

    if (
      (input.source.kind as string) === DocumentSourceKind.FILE &&
      !input.source.filename
    ) {
      throw new BadRequestException('Filename is required for FILE source');
    }
    if (
      (input.source.kind as string) === DocumentSourceKind.URL &&
      !input.source.requestedUrl
    ) {
      throw new BadRequestException('Requested URL is required for URL source');
    }
  }

  private calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
