import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { IngestionService } from './ingestion.service';
import { IngestDocumentInput } from '../graphql/inputs/ingest-document.input';
import { Document } from '@models/document.model';

@Resolver()
@UseGuards(JwtAuthGuard)
export class IngestionResolver {
  constructor(private readonly ingestionService: IngestionService) {}

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
}
