import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import { EntityRelationshipEvidenceMention } from '@models/entity-relationship-evidence-mention.model';
import { EntityMention } from '@models/entity-mention.model';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => EntityRelationshipEvidenceMention)
@UseGuards(JwtAuthGuard)
export class EntityRelationshipEvidenceMentionResolver {
  constructor(private readonly dataLoaders: DataLoaderService) {}

  @ResolveField(() => EntityMention)
  async mention(@Parent() link: EntityRelationshipEvidenceMention) {
    return this.dataLoaders.getEntityMentionLoader().load(link.mentionId);
  }
}

