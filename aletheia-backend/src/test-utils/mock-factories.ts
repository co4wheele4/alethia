// src/test-utils/mock-factories.ts
import { User } from '@models/user.model';
import { Lesson } from '@models/lesson.model';
import { Document } from '@models/document.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { Entity } from '@models/entity.model';
import { EntityMention } from '@models/entity-mention.model';
import { EntityRelationship } from '@models/entity-relationship.model';
import { Embedding } from '@models/embedding.model';
import { AiQuery } from '@models/ai-query.model';
import { AiQueryResult } from '@models/ai-query.model';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  lessons: [],
  documents: [],
  aiQueries: [],
  ...overrides,
});

export const createMockLesson = (overrides?: Partial<Lesson>): Lesson => ({
  id: 'lesson-1',
  title: 'Test Lesson',
  content: 'Test content',
  user: createMockUser(),
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockDocument = (
  overrides?: Partial<Document>,
): Document => ({
  id: 'doc-1',
  title: 'Test Document',
  user: createMockUser(),
  createdAt: new Date('2024-01-01'),
  chunks: [],
  ...overrides,
});

export const createMockDocumentChunk = (
  overrides?: Partial<DocumentChunk>,
): DocumentChunk => ({
  id: 'chunk-1',
  documentId: 'doc-1',
  chunkIndex: 0,
  content: 'Test content',
  // embeddings: [], // Removed - not a direct field on DocumentChunk model
  ...overrides,
});

export const createMockEntity = (overrides?: Partial<Entity>): Entity => ({
  id: 'entity-1',
  name: 'Test Entity',
  type: 'Person',
  mentionCount: 0,
  mentions: [],
  outgoing: [],
  incoming: [],
  ...overrides,
});

export const createMockEntityMention = (
  overrides?: Partial<EntityMention>,
): EntityMention => {
  const entity = overrides?.entity ?? createMockEntity();
  const chunk = overrides?.chunk ?? createMockDocumentChunk();

  // Ensure required persisted FK fields are always present.
  const entityId = overrides?.entityId ?? entity.id;
  const chunkId = overrides?.chunkId ?? chunk.id;

  return {
    id: 'mention-1',
    entityId,
    chunkId,
    startOffset: null,
    endOffset: null,
    excerpt: null,
    entity,
    chunk,
    ...overrides,
  };
};

export const createMockEntityRelationship = (
  overrides?: Partial<EntityRelationship>,
): EntityRelationship => {
  const { evidence, ...rest } = overrides ?? {};

  return {
    id: 'rel-1',
    relation: 'knows',
    from: createMockEntity(),
    to: createMockEntity({ id: 'entity-2', name: 'Other Entity' }),
    ...rest,
    evidence: evidence ?? [],
  };
};

export const createMockEmbedding = (
  overrides?: Partial<Embedding>,
): Embedding => ({
  id: 'embedding-1',
  values: [0.1, 0.2, 0.3],
  chunk: createMockDocumentChunk(),
  ...overrides,
});

export const createMockAiQuery = (overrides?: Partial<AiQuery>): AiQuery => ({
  id: 'query-1',
  query: 'What is Aletheia?',
  user: createMockUser(),
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockAiQueryResult = (
  overrides?: Partial<AiQueryResult>,
): AiQueryResult => ({
  id: 'result-1',
  answer: 'Aletheia is a system for truth discovery.',
  query: createMockAiQuery(),
  ...overrides,
});
