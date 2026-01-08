import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Document } from '@models/document.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { User } from '@models/user.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@Resolver(() => Document)
@UseGuards(JwtAuthGuard)
export class DocumentResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [Document])
  async documents() {
    return this.prisma.document.findMany();
  }

  @Query(() => Document, { nullable: true })
  async document(@Args('id') id: string) {
    return this.prisma.document.findUnique({ where: { id } });
  }

  @Query(() => [Document])
  async documentsByUser(@Args('userId') userId: string) {
    return this.prisma.document.findMany({ where: { userId } });
  }

  @Mutation(() => Document)
  async createDocument(
    @Args('title') title: string,
    @Args('userId') userId: string,
  ) {
    return this.prisma.document.create({ data: { title, userId } });
  }

  @Mutation(() => Document)
  async updateDocument(
    @Args('id') id: string,
    @Args('title', { nullable: true }) title?: string,
  ) {
    return this.prisma.document.update({ where: { id }, data: { title } });
  }

  @Mutation(() => Document)
  async deleteDocument(@Args('id') id: string) {
    return this.prisma.document.delete({ where: { id } });
  }

  @ResolveField(() => User)
  async user(@Parent() document: Document) {
    // Access userId from the database field, not the GraphQL field
    const documentWithUserId = document as unknown as { userId: string };
    return this.prisma.user.findUnique({
      where: { id: documentWithUserId.userId },
    });
  }

  @ResolveField(() => [DocumentChunk])
  async chunks(@Parent() document: Document) {
    return this.prisma.documentChunk.findMany({
      where: { documentId: document.id },
    });
  }
}
