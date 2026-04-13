import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '@prisma/prisma.service';
import {
  User as PrismaUser,
  Lesson as PrismaLesson,
  Document as PrismaDocument,
  DocumentSource as PrismaDocumentSource,
  DocumentChunk as PrismaDocumentChunk,
  Entity as PrismaEntity,
  EntityMention as PrismaEntityMention,
  EntityRelationship as PrismaEntityRelationship,
  EntityRelationshipEvidence as PrismaEntityRelationshipEvidence,
  EntityRelationshipEvidenceMention as PrismaEntityRelationshipEvidenceMention,
} from '@prisma/client';
import { User } from '@models/user.model';
import { Lesson } from '@models/lesson.model';
import { Document } from '@models/document.model';
import { DocumentSource } from '@models/document-source.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { Entity } from '@models/entity.model';
import { EntityMention } from '@models/entity-mention.model';
import { EntityRelationship } from '@models/entity-relationship.model';
import { EntityRelationshipEvidence } from '@models/entity-relationship-evidence.model';
import { EntityRelationshipEvidenceMention } from '@models/entity-relationship-evidence-mention.model';
/** Prisma stores `lastModifiedMs` as BigInt; GraphQL exposes it as String (ADR-031). */
function documentSourceRowToGql(row: PrismaDocumentSource): DocumentSource {
  return {
    ...(row as unknown as DocumentSource),
    lastModifiedMs:
      row.lastModifiedMs == null ? null : String(row.lastModifiedMs),
  };
}

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
  private readonly documentSourceByDocumentLoader: DataLoader<
    string,
    DocumentSource | null
  >;
  private readonly documentChunkLoader: DataLoader<
    string,
    DocumentChunk | null
  >;
  private readonly chunksByDocumentLoader: DataLoader<string, DocumentChunk[]>;
  private readonly entityLoader: DataLoader<string, Entity | null>;
  private readonly entityMentionLoader: DataLoader<
    string,
    EntityMention | null
  >;
  private readonly mentionsByEntityLoader: DataLoader<string, EntityMention[]>;
  private readonly mentionCountByEntityLoader: DataLoader<string, number>;
  private readonly mentionsByChunkLoader: DataLoader<string, EntityMention[]>;
  private readonly entityRelationshipLoader: DataLoader<
    string,
    EntityRelationship | null
  >;
  private readonly relationshipEvidenceByRelationshipLoader: DataLoader<
    string,
    EntityRelationshipEvidence[]
  >;
  private readonly evidenceMentionLinksByEvidenceLoader: DataLoader<
    string,
    EntityRelationshipEvidenceMention[]
  >;
  private readonly relationshipsByFromEntityLoader: DataLoader<
    string,
    EntityRelationship[]
  >;
  private readonly relationshipsByToEntityLoader: DataLoader<
    string,
    EntityRelationship[]
  >;

  constructor(private readonly prisma: PrismaService) {
    // User loaders
    this.userLoader = new DataLoader<string, User | null>(
      async (ids: readonly string[]) => {
        const users: PrismaUser[] = await this.prisma.user.findMany({
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
        const lessons: PrismaLesson[] = await this.prisma.lesson.findMany({
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
        const lessons: PrismaLesson[] = await this.prisma.lesson.findMany({
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
        const documents: PrismaDocument[] = await this.prisma.document.findMany(
          {
            where: { id: { in: [...ids] } },
          },
        );
        const documentMap = new Map(
          documents.map((doc) => [doc.id, doc as unknown as Document]),
        );
        return ids.map((id) => documentMap.get(id) ?? null);
      },
    );

    this.documentsByUserLoader = new DataLoader<string, Document[]>(
      async (userIds: readonly string[]) => {
        const documents: PrismaDocument[] = await this.prisma.document.findMany(
          {
            where: { userId: { in: [...userIds] } },
          },
        );
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

    this.documentSourceByDocumentLoader = new DataLoader<
      string,
      DocumentSource | null
    >(async (documentIds: readonly string[]) => {
      const sources: PrismaDocumentSource[] =
        await this.prisma.documentSource.findMany({
          where: { documentId: { in: [...documentIds] } },
        });
      const sourceByDocumentId = new Map(
        sources.map((source) => [
          source.documentId,
          documentSourceRowToGql(source),
        ]),
      );
      return documentIds.map(
        (documentId) => sourceByDocumentId.get(documentId) ?? null,
      );
    });

    // DocumentChunk loaders
    this.documentChunkLoader = new DataLoader<string, DocumentChunk | null>(
      async (ids: readonly string[]) => {
        const chunks: PrismaDocumentChunk[] =
          await this.prisma.documentChunk.findMany({
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
        const chunks: PrismaDocumentChunk[] =
          await this.prisma.documentChunk.findMany({
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

    // Entity loaders
    this.entityLoader = new DataLoader<string, Entity | null>(
      async (ids: readonly string[]) => {
        const entities: PrismaEntity[] = await this.prisma.entity.findMany({
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
        const mentions: PrismaEntityMention[] =
          await this.prisma.entityMention.findMany({
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
        const mentions: PrismaEntityMention[] =
          await this.prisma.entityMention.findMany({
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

    this.mentionCountByEntityLoader = new DataLoader<string, number>(
      async (entityIds: readonly string[]) => {
        const grouped = await this.prisma.entityMention.groupBy({
          by: ['entityId'],
          where: { entityId: { in: [...entityIds] } },
          _count: { _all: true },
        });

        const countByEntityId = new Map<string, number>();
        for (const entityId of entityIds) countByEntityId.set(entityId, 0);
        for (const row of grouped) {
          countByEntityId.set(row.entityId, row._count._all);
        }
        // Every requested entityId is pre-seeded to 0 above, so this is always defined.
        return entityIds.map((entityId) => countByEntityId.get(entityId)!);
      },
    );

    this.mentionsByChunkLoader = new DataLoader<string, EntityMention[]>(
      async (chunkIds: readonly string[]) => {
        const mentions: PrismaEntityMention[] =
          await this.prisma.entityMention.findMany({
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
      const relationships: PrismaEntityRelationship[] =
        await this.prisma.entityRelationship.findMany({
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

    this.relationshipEvidenceByRelationshipLoader = new DataLoader<
      string,
      EntityRelationshipEvidence[]
    >(async (relationshipIds: readonly string[]) => {
      const evidence: PrismaEntityRelationshipEvidence[] =
        await this.prisma.entityRelationshipEvidence.findMany({
          where: { relationshipId: { in: [...relationshipIds] } },
          orderBy: { createdAt: 'asc' },
        });
      const evidenceByRelationshipId = new Map<
        string,
        EntityRelationshipEvidence[]
      >();
      for (const relationshipId of relationshipIds) {
        evidenceByRelationshipId.set(relationshipId, []);
      }
      for (const e of evidence) {
        const list = evidenceByRelationshipId.get(e.relationshipId) ?? [];
        list.push(e as unknown as EntityRelationshipEvidence);
        evidenceByRelationshipId.set(e.relationshipId, list);
      }
      return relationshipIds.map(
        (relationshipId) => evidenceByRelationshipId.get(relationshipId)!,
      );
    });

    this.evidenceMentionLinksByEvidenceLoader = new DataLoader<
      string,
      EntityRelationshipEvidenceMention[]
    >(async (ids: readonly string[]) => {
      const links: PrismaEntityRelationshipEvidenceMention[] =
        await this.prisma.entityRelationshipEvidenceMention.findMany({
          where: { evidenceId: { in: [...ids] } },
        });
      const linksByEvidenceId = new Map<
        string,
        EntityRelationshipEvidenceMention[]
      >();
      for (const id of ids) {
        linksByEvidenceId.set(id, []);
      }
      for (const link of links) {
        const list = linksByEvidenceId.get(link.evidenceId) ?? [];
        list.push(link as unknown as EntityRelationshipEvidenceMention);
        linksByEvidenceId.set(link.evidenceId, list);
      }
      return ids.map((id) => linksByEvidenceId.get(id)!);
    });

    this.relationshipsByFromEntityLoader = new DataLoader<
      string,
      EntityRelationship[]
    >(async (entityIds: readonly string[]) => {
      const relationships: PrismaEntityRelationship[] =
        await this.prisma.entityRelationship.findMany({
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
      const relationships: PrismaEntityRelationship[] =
        await this.prisma.entityRelationship.findMany({
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

  getDocumentSourceByDocumentLoader(): DataLoader<
    string,
    DocumentSource | null
  > {
    return this.documentSourceByDocumentLoader;
  }

  // DocumentChunk loaders
  getDocumentChunkLoader(): DataLoader<string, DocumentChunk | null> {
    return this.documentChunkLoader;
  }

  getChunksByDocumentLoader(): DataLoader<string, DocumentChunk[]> {
    return this.chunksByDocumentLoader;
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

  getMentionCountByEntityLoader(): DataLoader<string, number> {
    return this.mentionCountByEntityLoader;
  }

  getMentionsByChunkLoader(): DataLoader<string, EntityMention[]> {
    return this.mentionsByChunkLoader;
  }

  // EntityRelationship loaders
  getEntityRelationshipLoader(): DataLoader<string, EntityRelationship | null> {
    return this.entityRelationshipLoader;
  }

  getRelationshipEvidenceByRelationshipLoader(): DataLoader<
    string,
    EntityRelationshipEvidence[]
  > {
    return this.relationshipEvidenceByRelationshipLoader;
  }

  getEvidenceMentionLinksByEvidenceLoader(): DataLoader<
    string,
    EntityRelationshipEvidenceMention[]
  > {
    return this.evidenceMentionLinksByEvidenceLoader;
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
}
