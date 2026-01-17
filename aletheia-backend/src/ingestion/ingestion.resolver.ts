import { Resolver, Mutation, Args, Context, ID, Query } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IngestionService } from './ingestion.service';
import { ExtractionService } from './extraction.service';
import { IngestDocumentInput } from '../graphql/inputs/ingest-document.input';
import { Document } from '@models/document.model';
import { AiExtractionSuggestion } from '@models/ai-extraction-suggestion.model';

@Resolver()
@UseGuards(JwtAuthGuard)
export class IngestionResolver {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly extractionService: ExtractionService,
  ) {}

  @Query(() => String)
  ingestionHealthCheck() {
    return 'ok';
  }

  @Mutation(() => Document)
  async ingestDocument(
    @Args('input') input: IngestDocumentInput,
    @Context() ctx: { req?: { user?: { sub?: string } } },
  ) {
    const authUserId = ctx?.req?.user?.sub;
    if (authUserId && authUserId !== input.userId) {
      throw new ForbiddenException('Cannot ingest documents for another user');
    }

    return await this.ingestionService.ingest(input);
  }

  @Mutation(() => [AiExtractionSuggestion])
  async proposeExtraction(
    @Args('chunkId', { type: () => ID }) chunkId: string,
  ) {
    return this.extractionService.proposeExtraction(chunkId);
  }

  @Mutation(() => AiExtractionSuggestion)
  async acceptSuggestion(@Args('id', { type: () => ID }) id: string) {
    return await this.extractionService.acceptSuggestion(id);
  }

  @Mutation(() => AiExtractionSuggestion)
  async rejectSuggestion(@Args('id', { type: () => ID }) id: string) {
    return await this.extractionService.rejectSuggestion(id);
  }
}
