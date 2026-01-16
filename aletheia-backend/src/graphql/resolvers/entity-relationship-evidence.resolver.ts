import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import { EntityRelationshipEvidence } from '@models/entity-relationship-evidence.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { EntityRelationshipEvidenceMention } from '@models/entity-relationship-evidence-mention.model';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => EntityRelationshipEvidence)
@UseGuards(JwtAuthGuard)
export class EntityRelationshipEvidenceResolver {
  constructor(private readonly dataLoaders: DataLoaderService) {}

  @ResolveField(() => DocumentChunk)
  async chunk(@Parent() evidence: EntityRelationshipEvidence) {
    const evidenceWithChunkId = evidence as unknown as { chunkId: string };
    return this.dataLoaders
      .getDocumentChunkLoader()
      .load(evidenceWithChunkId.chunkId);
  }

  @ResolveField(() => [EntityRelationshipEvidenceMention])
  async mentionLinks(@Parent() evidence: EntityRelationshipEvidence) {
    return this.dataLoaders
      .getEvidenceMentionLinksByEvidenceLoader()
      .load(evidence.id);
  }
}
