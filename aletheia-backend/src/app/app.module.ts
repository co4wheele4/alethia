// src/app/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLJSON } from 'graphql-scalars';
import { GraphQLThrottlerGuard } from '../common/guards/graphql-throttler.guard';
import { AssertNoDerivedSemanticsGuard } from '../graphql/guards/assertNoDerivedSemantics';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Request, Response } from 'express';

import { validate } from '../config/env.validation';
import { PrismaService } from '@prisma/prisma.service';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { AppService } from './app.service';

import { AppResolver } from '../graphql/resolvers/app.resolver';
import {
  DocumentResolver,
  DocumentChunkResolver,
  UserResolver,
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
  EvidenceReproResolver,
  AletheiaBundleResolver,
  EpistemicEventsResolver,
  SearchResolver,
  IntegrityResolver,
} from '@resolvers';
import { IntegrityService } from '../integrity/integrity.service';
import { EvidenceReproCheckService } from '../evidence-repro/evidence-repro-check.service';
import { AletheiaBundleService } from '../bundle/aletheia-bundle.service';
import { EpistemicAuditInterceptor } from '../observability/epistemic-audit.interceptor';
import { AuthModule } from '../auth/auth.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { DataLoaderModule } from '../common/dataloaders/dataloader.module';
import { createGraphQLContext, formatGraphQLError } from './graphql-config';
import {
  adr034DepthLimitRule,
  adr034QueryCostLimitRule,
} from '../graphql/graphql-validation-rules';

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
      validationRules: [adr034DepthLimitRule, adr034QueryCostLimitRule()],
      sortSchema: true, // Sort schema for better readability
      // Dev UX: use Nest/Apollo GraphiQL landing page (not deprecated GraphQL Playground).
      graphiql: process.env.NODE_ENV !== 'production',
      playground: false,
      introspection: process.env.NODE_ENV !== 'production', // Enable in development only
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    PrismaService,
    AppResolver,
    DocumentResolver,
    DocumentChunkResolver,
    UserResolver,
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
    EvidenceReproCheckService,
    AletheiaBundleService,
    EvidenceReproResolver,
    AletheiaBundleResolver,
    EpistemicEventsResolver,
    SearchResolver,
    IntegrityResolver,
    IntegrityService,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: EpistemicAuditInterceptor,
    },
  ],
})
export class AppModule {}
