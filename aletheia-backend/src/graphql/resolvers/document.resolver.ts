import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import {
  UseGuards,
  Scope,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Document } from '@models/document.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { DocumentSource } from '@models/document-source.model';
import { User } from '@models/user.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

type GqlRequestContext = {
  req?: {
    user?: {
      sub?: string;
    };
  };
};

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => Document)
@UseGuards(JwtAuthGuard)
export class DocumentResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(() => [Document])
  async documents() {
    return await this.prisma.document.findMany();
  }

  @Query(() => Document, { nullable: true })
  async document(@Args('id') id: string) {
    return await this.prisma.document.findUnique({ where: { id } });
  }

  @Query(() => [Document])
  async documentsByUser(
    @Args('userId') userId: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = ctx?.req?.user?.sub;
    if (authUserId && authUserId !== userId) {
      throw new ForbiddenException('Cannot access documents for another user');
    }
    return await this.prisma.document.findMany({ where: { userId } });
  }

  @Mutation(() => Document)
  async createDocument(
    @Args('title') title: string,
    @Args('userId') userId: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = ctx?.req?.user?.sub;
    if (authUserId && authUserId !== userId) {
      throw new ForbiddenException('Cannot create documents for another user');
    }
    return await this.prisma.document.create({ data: { title, userId } });
  }

  @Mutation(() => Document)
  async updateDocument(
    @Args('id') id: string,
    @Args('title', { nullable: true }) title?: string,
  ) {
    return await this.prisma.document.update({
      where: { id },
      data: { title },
    });
  }

  @Mutation(() => Document)
  async deleteDocument(
    @Args('id') id: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = ctx?.req?.user?.sub;
    if (authUserId) {
      const existing = await this.prisma.document.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      // Prisma returns null if not found; let prisma.delete throw consistent error later
      if (existing && existing.userId !== authUserId) {
        throw new ForbiddenException(
          'Cannot delete documents for another user',
        );
      }
    }
    return await this.prisma.document.delete({ where: { id } });
  }

  @ResolveField(() => User)
  async user(@Parent() document: Document) {
    // Access userId from the database field, not the GraphQL field
    const documentWithUserId = document as unknown as { userId: string };
    return this.dataLoaders.getUserLoader().load(documentWithUserId.userId);
  }

  @ResolveField(() => [DocumentChunk])
  async chunks(@Parent() document: Document) {
    return this.dataLoaders.getChunksByDocumentLoader().load(document.id);
  }

  /* c8 ignore next */
  @ResolveField(() => DocumentSource, { nullable: true })
  async source(@Parent() document: Document) {
    return this.dataLoaders.getDocumentSourceByDocumentLoader().load(document.id);
  }
}
