// src/app/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLThrottlerGuard } from '../common/guards/graphql-throttler.guard';
import { AssertNoDerivedSemanticsGuard } from '../graphql/guards/assertNoDerivedSemantics';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Request, Response } from 'express';

import { validate } from '../config/env.validation';
import { PrismaService } from '@prisma/prisma.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AppResolver } from '../graphql/resolvers/app.resolver';
import {
  LessonResolver,
  DocumentResolver,
  DocumentChunkResolver,
  UserResolver,
  AiQueryResolver,
  AiQueryResultResolver,
  EmbeddingResolver,
  EntityResolver,
  EntityMentionResolver,
  EntityRelationshipResolver,
  EntityRelationshipEvidenceResolver,
  EntityRelationshipEvidenceMentionResolver,
  ClaimResolver,
  EvidenceResolver,
  ClaimAdjudicationResolver,
  ClaimAdjudicationService,
  ReviewRequestResolver,
  ReviewAssignmentResolver,
} from '@resolvers';
import { AuthModule } from '../auth/auth.module';
import { OpenAIModule } from '../openai/openai.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { DataLoaderModule } from '../common/dataloaders/dataloader.module';
import { createGraphQLContext, formatGraphQLError } from './graphql-config';

@Module({
  imports: [
    // Environment configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env.local', '.env'],
    }),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    // Authentication
    AuthModule,
    // OpenAI module
    OpenAIModule,
    // Ingestion module
    IngestionModule,
    // DataLoader module for N+1 query optimization
    DataLoaderModule,
    // GraphQL configuration
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: createGraphQLContext,
      formatError: formatGraphQLError,
      sortSchema: true, // Sort schema for better readability
      // Apollo Server 5 configuration - playground and introspection are still supported
      // Note: In Apollo Server 5, these are still valid options in NestJS GraphQL module
      playground: process.env.NODE_ENV !== 'production', // Enable in development only
      introspection: process.env.NODE_ENV !== 'production', // Enable in development only
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    AppResolver,
    LessonResolver,
    DocumentResolver,
    DocumentChunkResolver,
    UserResolver,
    AiQueryResolver,
    AiQueryResultResolver,
    EmbeddingResolver,
    EntityResolver,
    EntityMentionResolver,
    EntityRelationshipResolver,
    EntityRelationshipEvidenceResolver,
    EntityRelationshipEvidenceMentionResolver,
    ClaimResolver,
    EvidenceResolver,
    ClaimAdjudicationService,
    ClaimAdjudicationResolver,
    ReviewRequestResolver,
    ReviewAssignmentResolver,
    // Apply rate limiting globally (GraphQL-compatible)
    {
      provide: APP_GUARD,
      useClass: GraphQLThrottlerGuard,
    },
    // ADR-022: Reject derived-semantic query terms (orderBy, sort, compare, score, rank, confidence)
    {
      provide: APP_GUARD,
      useClass: AssertNoDerivedSemanticsGuard,
    },
  ],
})
export class AppModule {}
