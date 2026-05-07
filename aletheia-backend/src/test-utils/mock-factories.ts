// src/test-utils/mock-factories.ts
import { User } from '@models/user.model';
import { Document } from '@models/document.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { Entity } from '@models/entity.model';
import { EntityMention } from '@models/entity-mention.model';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  documents: [],
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
): EntityMention => ({
  id: 'mention-1',
  entityId: 'entity-1',
  chunkId: 'chunk-1',
  startOffset: 0,
  endOffset: 4,
  excerpt: null,
  entity: createMockEntity(),
  chunk: createMockDocumentChunk(),
  ...overrides,
});
