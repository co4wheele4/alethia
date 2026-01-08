import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@models/user.model';
import { Lesson } from '@models/lesson.model';
import { Document } from '@models/document.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { Embedding } from '@models/embedding.model';
import { Entity } from '@models/entity.model';
import { EntityMention } from '@models/entity-mention.model';
import { EntityRelationship } from '@models/entity-relationship.model';
import { AiQuery, AiQueryResult } from '@models/ai-query.model';

/**
 * DataLoader service that provides batched loaders for all entity types
 * This service is request-scoped to ensure each GraphQL request has its own loaders
 */
@Injectable({ scope: Scope.REQUEST })
export class DataLoaderService {
  private readonly userLoader: DataLoader<string, User | null>;
  private readonly lessonLoader: DataLoader<string, Lesson | null>;
  private readonly lessonsByUserLoader: DataLoader<string, Lesson[]>;
  private readonly documentLoader: DataLoader<string, Document | null>;
  private readonly documentsByUserLoader: DataLoader<string, Document[]>;
  private readonly documentChunkLoader: DataLoader<
    string,
    DocumentChunk | null
  >;
  private readonly chunksByDocumentLoader: DataLoader<string, DocumentChunk[]>;
  private readonly embeddingLoader: DataLoader<string, Embedding | null>;
  private readonly embeddingsByChunkLoader: DataLoader<string, Embedding[]>;
  private readonly entityLoader: DataLoader<string, Entity | null>;
  private readonly entityMentionLoader: DataLoader<
    string,
    EntityMention | null
  >;
  private readonly mentionsByEntityLoader: DataLoader<string, EntityMention[]>;
  private readonly mentionsByChunkLoader: DataLoader<string, EntityMention[]>;
  private readonly entityRelationshipLoader: DataLoader<
    string,
    EntityRelationship | null
  >;
  private readonly relationshipsByFromEntityLoader: DataLoader<
    string,
    EntityRelationship[]
  >;
  private readonly relationshipsByToEntityLoader: DataLoader<
    string,
    EntityRelationship[]
  >;
  private readonly aiQueryLoader: DataLoader<string, AiQuery | null>;
  private readonly aiQueriesByUserLoader: DataLoader<string, AiQuery[]>;
  private readonly aiQueryResultLoader: DataLoader<
    string,
    AiQueryResult | null
  >;
  private readonly resultsByQueryLoader: DataLoader<string, AiQueryResult[]>;

  constructor(private readonly prisma: PrismaService) {
    // User loaders
    this.userLoader = new DataLoader<string, User | null>(
      async (ids: readonly string[]) => {
        const users = await this.prisma.user.findMany({
          where: { id: { in: [...ids] } },
        });
        const userMap = new Map(
          users.map((user) => [user.id, user as unknown as User]),
        );
        return ids.map((id) => userMap.get(id) ?? null);
      },
    );

    // Lesson loaders
    this.lessonLoader = new DataLoader<string, Lesson | null>(
      async (ids: readonly string[]) => {
        const lessons = await this.prisma.lesson.findMany({
          where: { id: { in: [...ids] } },
        });
        const lessonMap = new Map(
          lessons.map((lesson) => [lesson.id, lesson as unknown as Lesson]),
        );
        return ids.map((id) => lessonMap.get(id) ?? null);
      },
    );

    this.lessonsByUserLoader = new DataLoader<string, Lesson[]>(
      async (userIds: readonly string[]) => {
        const lessons = await this.prisma.lesson.findMany({
          where: { userId: { in: [...userIds] } },
        });
        const lessonsByUser = new Map<string, Lesson[]>();
        for (const userId of userIds) {
          lessonsByUser.set(userId, []);
        }
        for (const lesson of lessons) {
          const userLessons = lessonsByUser.get(lesson.userId) ?? [];
          userLessons.push(lesson as unknown as Lesson);
          lessonsByUser.set(lesson.userId, userLessons);
        }
        return userIds.map((userId) => lessonsByUser.get(userId)!);
      },
    );

    // Document loaders
    this.documentLoader = new DataLoader<string, Document | null>(
      async (ids: readonly string[]) => {
        const documents = await this.prisma.document.findMany({
          where: { id: { in: [...ids] } },
        });
        const documentMap = new Map(
          documents.map((doc) => [doc.id, doc as unknown as Document]),
        );
        return ids.map((id) => documentMap.get(id) ?? null);
      },
    );

    this.documentsByUserLoader = new DataLoader<string, Document[]>(
      async (userIds: readonly string[]) => {
        const documents = await this.prisma.document.findMany({
          where: { userId: { in: [...userIds] } },
        });
        const documentsByUser = new Map<string, Document[]>();
        for (const userId of userIds) {
          documentsByUser.set(userId, []);
        }
        for (const document of documents) {
          const userDocuments = documentsByUser.get(document.userId) ?? [];
          userDocuments.push(document as unknown as Document);
          documentsByUser.set(document.userId, userDocuments);
        }
        return userIds.map((userId) => documentsByUser.get(userId)!);
      },
    );

    // DocumentChunk loaders
    this.documentChunkLoader = new DataLoader<string, DocumentChunk | null>(
      async (ids: readonly string[]) => {
        const chunks = await this.prisma.documentChunk.findMany({
          where: { id: { in: [...ids] } },
        });
        const chunkMap = new Map(
          chunks.map((chunk) => [chunk.id, chunk as unknown as DocumentChunk]),
        );
        return ids.map((id) => chunkMap.get(id) ?? null);
      },
    );

    this.chunksByDocumentLoader = new DataLoader<string, DocumentChunk[]>(
      async (documentIds: readonly string[]) => {
        const chunks = await this.prisma.documentChunk.findMany({
          where: { documentId: { in: [...documentIds] } },
        });
        const chunksByDocument = new Map<string, DocumentChunk[]>();
        for (const documentId of documentIds) {
          chunksByDocument.set(documentId, []);
        }
        for (const chunk of chunks) {
          const docChunks = chunksByDocument.get(chunk.documentId) ?? [];
          docChunks.push(chunk as unknown as DocumentChunk);
          chunksByDocument.set(chunk.documentId, docChunks);
        }
        return documentIds.map(
          (documentId) => chunksByDocument.get(documentId)!,
        );
      },
    );

    // Embedding loaders
    this.embeddingLoader = new DataLoader<string, Embedding | null>(
      async (ids: readonly string[]) => {
        const embeddings = await this.prisma.embedding.findMany({
          where: { id: { in: [...ids] } },
        });
        const embeddingMap = new Map(
          embeddings.map((emb) => [emb.id, emb as unknown as Embedding]),
        );
        return ids.map((id) => embeddingMap.get(id) ?? null);
      },
    );

    this.embeddingsByChunkLoader = new DataLoader<string, Embedding[]>(
      async (chunkIds: readonly string[]) => {
        const embeddings = await this.prisma.embedding.findMany({
          where: { chunkId: { in: [...chunkIds] } },
        });
        const embeddingsByChunk = new Map<string, Embedding[]>();
        for (const chunkId of chunkIds) {
          embeddingsByChunk.set(chunkId, []);
        }
        for (const embedding of embeddings) {
          const chunkEmbeddings =
            embeddingsByChunk.get(embedding.chunkId) ?? [];
          chunkEmbeddings.push(embedding as unknown as Embedding);
          embeddingsByChunk.set(embedding.chunkId, chunkEmbeddings);
        }
        return chunkIds.map((chunkId) => embeddingsByChunk.get(chunkId)!);
      },
    );

    // Entity loaders
    this.entityLoader = new DataLoader<string, Entity | null>(
      async (ids: readonly string[]) => {
        const entities = await this.prisma.entity.findMany({
          where: { id: { in: [...ids] } },
        });
        const entityMap = new Map(
          entities.map((entity) => [entity.id, entity as unknown as Entity]),
        );
        return ids.map((id) => entityMap.get(id) ?? null);
      },
    );

    // EntityMention loaders
    this.entityMentionLoader = new DataLoader<string, EntityMention | null>(
      async (ids: readonly string[]) => {
        const mentions = await this.prisma.entityMention.findMany({
          where: { id: { in: [...ids] } },
        });
        const mentionMap = new Map(
          mentions.map((mention) => [
            mention.id,
            mention as unknown as EntityMention,
          ]),
        );
        return ids.map((id) => mentionMap.get(id) ?? null);
      },
    );

    this.mentionsByEntityLoader = new DataLoader<string, EntityMention[]>(
      async (entityIds: readonly string[]) => {
        const mentions = await this.prisma.entityMention.findMany({
          where: { entityId: { in: [...entityIds] } },
        });
        const mentionsByEntity = new Map<string, EntityMention[]>();
        for (const entityId of entityIds) {
          mentionsByEntity.set(entityId, []);
        }
        for (const mention of mentions) {
          const entityMentions = mentionsByEntity.get(mention.entityId) ?? [];
          entityMentions.push(mention as unknown as EntityMention);
          mentionsByEntity.set(mention.entityId, entityMentions);
        }
        return entityIds.map((entityId) => mentionsByEntity.get(entityId)!);
      },
    );

    this.mentionsByChunkLoader = new DataLoader<string, EntityMention[]>(
      async (chunkIds: readonly string[]) => {
        const mentions = await this.prisma.entityMention.findMany({
          where: { chunkId: { in: [...chunkIds] } },
        });
        const mentionsByChunk = new Map<string, EntityMention[]>();
        for (const chunkId of chunkIds) {
          mentionsByChunk.set(chunkId, []);
        }
        for (const mention of mentions) {
          const chunkMentions = mentionsByChunk.get(mention.chunkId) ?? [];
          chunkMentions.push(mention as unknown as EntityMention);
          mentionsByChunk.set(mention.chunkId, chunkMentions);
        }
        return chunkIds.map((chunkId) => mentionsByChunk.get(chunkId)!);
      },
    );

    // EntityRelationship loaders
    this.entityRelationshipLoader = new DataLoader<
      string,
      EntityRelationship | null
    >(async (ids: readonly string[]) => {
      const relationships = await this.prisma.entityRelationship.findMany({
        where: { id: { in: [...ids] } },
      });
      const relationshipMap = new Map(
        relationships.map((rel) => [
          rel.id,
          rel as unknown as EntityRelationship,
        ]),
      );
      return ids.map((id) => relationshipMap.get(id) ?? null);
    });

    this.relationshipsByFromEntityLoader = new DataLoader<
      string,
      EntityRelationship[]
    >(async (entityIds: readonly string[]) => {
      const relationships = await this.prisma.entityRelationship.findMany({
        where: { fromEntity: { in: [...entityIds] } },
      });
      const relationshipsByFrom = new Map<string, EntityRelationship[]>();
      for (const entityId of entityIds) {
        relationshipsByFrom.set(entityId, []);
      }
      for (const relationship of relationships) {
        const fromRelationships =
          relationshipsByFrom.get(relationship.fromEntity) ?? [];
        fromRelationships.push(relationship as unknown as EntityRelationship);
        relationshipsByFrom.set(relationship.fromEntity, fromRelationships);
      }
      return entityIds.map((entityId) => relationshipsByFrom.get(entityId)!);
    });

    this.relationshipsByToEntityLoader = new DataLoader<
      string,
      EntityRelationship[]
    >(async (entityIds: readonly string[]) => {
      const relationships = await this.prisma.entityRelationship.findMany({
        where: { toEntity: { in: [...entityIds] } },
      });
      const relationshipsByTo = new Map<string, EntityRelationship[]>();
      for (const entityId of entityIds) {
        relationshipsByTo.set(entityId, []);
      }
      for (const relationship of relationships) {
        const toRelationships =
          relationshipsByTo.get(relationship.toEntity) ?? [];
        toRelationships.push(relationship as unknown as EntityRelationship);
        relationshipsByTo.set(relationship.toEntity, toRelationships);
      }
      return entityIds.map((entityId) => relationshipsByTo.get(entityId)!);
    });

    // AiQuery loaders
    this.aiQueryLoader = new DataLoader<string, AiQuery | null>(
      async (ids: readonly string[]) => {
        const queries = await this.prisma.aiQuery.findMany({
          where: { id: { in: [...ids] } },
        });
        const queryMap = new Map(
          queries.map((query) => [query.id, query as unknown as AiQuery]),
        );
        return ids.map((id) => queryMap.get(id) ?? null);
      },
    );

    this.aiQueriesByUserLoader = new DataLoader<string, AiQuery[]>(
      async (userIds: readonly string[]) => {
        const queries = await this.prisma.aiQuery.findMany({
          where: { userId: { in: [...userIds] } },
          orderBy: { createdAt: 'desc' },
        });
        const queriesByUser = new Map<string, AiQuery[]>();
        for (const userId of userIds) {
          queriesByUser.set(userId, []);
        }
        for (const query of queries) {
          const userQueries = queriesByUser.get(query.userId) ?? [];
          userQueries.push(query as unknown as AiQuery);
          queriesByUser.set(query.userId, userQueries);
        }
        return userIds.map((userId) => queriesByUser.get(userId)!);
      },
    );

    // AiQueryResult loaders
    this.aiQueryResultLoader = new DataLoader<string, AiQueryResult | null>(
      async (ids: readonly string[]) => {
        const results = await this.prisma.aiQueryResult.findMany({
          where: { id: { in: [...ids] } },
        });
        const resultMap = new Map(
          results.map((result) => [
            result.id,
            result as unknown as AiQueryResult,
          ]),
        );
        return ids.map((id) => resultMap.get(id) ?? null);
      },
    );

    this.resultsByQueryLoader = new DataLoader<string, AiQueryResult[]>(
      async (queryIds: readonly string[]) => {
        const results = await this.prisma.aiQueryResult.findMany({
          where: { queryId: { in: [...queryIds] } },
          orderBy: { createdAt: 'desc' },
        });
        const resultsByQuery = new Map<string, AiQueryResult[]>();
        for (const queryId of queryIds) {
          resultsByQuery.set(queryId, []);
        }
        for (const result of results) {
          const queryResults = resultsByQuery.get(result.queryId) ?? [];
          queryResults.push(result as unknown as AiQueryResult);
          resultsByQuery.set(result.queryId, queryResults);
        }
        return queryIds.map((queryId) => resultsByQuery.get(queryId)!);
      },
    );
  }

  // User loaders
  getUserLoader(): DataLoader<string, User | null> {
    return this.userLoader;
  }

  // Lesson loaders
  getLessonLoader(): DataLoader<string, Lesson | null> {
    return this.lessonLoader;
  }

  getLessonsByUserLoader(): DataLoader<string, Lesson[]> {
    return this.lessonsByUserLoader;
  }

  // Document loaders
  getDocumentLoader(): DataLoader<string, Document | null> {
    return this.documentLoader;
  }

  getDocumentsByUserLoader(): DataLoader<string, Document[]> {
    return this.documentsByUserLoader;
  }

  // DocumentChunk loaders
  getDocumentChunkLoader(): DataLoader<string, DocumentChunk | null> {
    return this.documentChunkLoader;
  }

  getChunksByDocumentLoader(): DataLoader<string, DocumentChunk[]> {
    return this.chunksByDocumentLoader;
  }

  // Embedding loaders
  getEmbeddingLoader(): DataLoader<string, Embedding | null> {
    return this.embeddingLoader;
  }

  getEmbeddingsByChunkLoader(): DataLoader<string, Embedding[]> {
    return this.embeddingsByChunkLoader;
  }

  // Entity loaders
  getEntityLoader(): DataLoader<string, Entity | null> {
    return this.entityLoader;
  }

  // EntityMention loaders
  getEntityMentionLoader(): DataLoader<string, EntityMention | null> {
    return this.entityMentionLoader;
  }

  getMentionsByEntityLoader(): DataLoader<string, EntityMention[]> {
    return this.mentionsByEntityLoader;
  }

  getMentionsByChunkLoader(): DataLoader<string, EntityMention[]> {
    return this.mentionsByChunkLoader;
  }

  // EntityRelationship loaders
  getEntityRelationshipLoader(): DataLoader<string, EntityRelationship | null> {
    return this.entityRelationshipLoader;
  }

  getRelationshipsByFromEntityLoader(): DataLoader<
    string,
    EntityRelationship[]
  > {
    return this.relationshipsByFromEntityLoader;
  }

  getRelationshipsByToEntityLoader(): DataLoader<string, EntityRelationship[]> {
    return this.relationshipsByToEntityLoader;
  }

  // AiQuery loaders
  getAiQueryLoader(): DataLoader<string, AiQuery | null> {
    return this.aiQueryLoader;
  }

  getAiQueriesByUserLoader(): DataLoader<string, AiQuery[]> {
    return this.aiQueriesByUserLoader;
  }

  // AiQueryResult loaders
  getAiQueryResultLoader(): DataLoader<string, AiQueryResult | null> {
    return this.aiQueryResultLoader;
  }

  getResultsByQueryLoader(): DataLoader<string, AiQueryResult[]> {
    return this.resultsByQueryLoader;
  }
}
