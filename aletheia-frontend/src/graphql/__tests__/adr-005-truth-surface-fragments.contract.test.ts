import { describe, expect, it } from 'vitest';
import { Kind, type DocumentNode, type FragmentDefinitionNode, type SelectionSetNode } from 'graphql';
import { print } from 'graphql';

import {
  DOCUMENT_CORE_FIELDS,
  ENTITY_CORE_FIELDS,
  ENTITY_MENTION_EVIDENCE_FIELDS,
  DOCUMENT_EVIDENCE_VIEW,
  GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
} from '@/src/graphql';

function fragmentMap(doc: DocumentNode): Map<string, FragmentDefinitionNode> {
  const m = new Map<string, FragmentDefinitionNode>();
  for (const def of doc.definitions) {
    if (def.kind === Kind.FRAGMENT_DEFINITION) m.set(def.name.value, def);
  }
  return m;
}

function collectFieldPaths(
  sel: SelectionSetNode,
  prefix: string,
  fragments: Map<string, FragmentDefinitionNode>,
  out: string[]
) {
  for (const s of sel.selections) {
    if (s.kind === Kind.FIELD) {
      const name = s.name.value;
      const path = prefix ? `${prefix}.${name}` : name;
      if (s.selectionSet) {
        collectFieldPaths(s.selectionSet, path, fragments, out);
      } else {
        out.push(path);
      }
      continue;
    }
    if (s.kind === Kind.FRAGMENT_SPREAD) {
      const def = fragments.get(s.name.value);
      if (!def) throw new Error(`Missing fragment definition for spread: ${s.name.value}`);
      collectFieldPaths(def.selectionSet, prefix, fragments, out);
      continue;
    }
    throw new Error(`Unsupported selection kind in contract test: ${s.kind}`);
  }
}

function fieldPathsForFragment(doc: DocumentNode, fragmentName: string): string[] {
  const fragments = fragmentMap(doc);
  const def = fragments.get(fragmentName);
  if (!def) throw new Error(`Missing fragment "${fragmentName}"`);
  const out: string[] = [];
  collectFieldPaths(def.selectionSet, '', fragments, out);
  return out.slice().sort();
}

function assertNoConfidenceInDoc(doc: DocumentNode, label: string) {
  const s = print(doc).toLowerCase();
  expect(s, `${label} must not mention confidence`).not.toContain('confidence');
  expect(s, `${label} must not mention probability`).not.toContain('probability');
}

describe('ADR-005 contract: Truth Surface fragments drift guard', () => {
  it('forbids confidence/probability in Truth Surface documents', () => {
    assertNoConfidenceInDoc(DOCUMENT_CORE_FIELDS, 'DOCUMENT_CORE_FIELDS');
    assertNoConfidenceInDoc(ENTITY_CORE_FIELDS, 'ENTITY_CORE_FIELDS');
    assertNoConfidenceInDoc(ENTITY_MENTION_EVIDENCE_FIELDS, 'ENTITY_MENTION_EVIDENCE_FIELDS');
    assertNoConfidenceInDoc(DOCUMENT_EVIDENCE_VIEW, 'DOCUMENT_EVIDENCE_VIEW');
    assertNoConfidenceInDoc(GET_DOCUMENT_EVIDENCE_VIEW_QUERY, 'GET_DOCUMENT_EVIDENCE_VIEW_QUERY');
  });

  it('DocumentCoreFields selection is exact (fails on drift)', () => {
    const expected = [
      '__typename',
      'createdAt',
      'id',
      'source.__typename',
      'source.accessedAt',
      'source.author',
      'source.contentSha256',
      'source.contentType',
      'source.documentId',
      'source.fetchedUrl',
      'source.fileSha256',
      'source.filename',
      'source.id',
      'source.ingestedAt',
      'source.kind',
      'source.lastModifiedMs',
      'source.mimeType',
      'source.publishedAt',
      'source.publisher',
      'source.requestedUrl',
      'source.sizeBytes',
      'sourceLabel',
      'sourceType',
      'title',
    ].sort();

    expect(fieldPathsForFragment(DOCUMENT_CORE_FIELDS, 'DocumentCoreFields')).toEqual(expected);
  });

  it('EntityCoreFields selection is exact (fails on drift)', () => {
    const expected = ['__typename', 'id', 'mentionCount', 'name', 'type'].sort();
    expect(fieldPathsForFragment(ENTITY_CORE_FIELDS, 'EntityCoreFields')).toEqual(expected);
  });

  it('EntityMentionEvidenceFields selection is exact (fails on drift)', () => {
    const expected = [
      '__typename',
      'chunkId',
      'endOffset',
      'entity.__typename',
      'entity.id',
      'entity.mentionCount',
      'entity.name',
      'entity.type',
      'entityId',
      'excerpt',
      'id',
      'startOffset',
    ].sort();
    expect(fieldPathsForFragment(ENTITY_MENTION_EVIDENCE_FIELDS, 'EntityMentionEvidenceFields')).toEqual(expected);
  });

  it('DocumentEvidenceView selection is exact (fails on drift)', () => {
    const expected = [
      '__typename',
      'createdAt',
      'id',
      'source.__typename',
      'source.accessedAt',
      'source.author',
      'source.contentSha256',
      'source.contentType',
      'source.documentId',
      'source.fetchedUrl',
      'source.fileSha256',
      'source.filename',
      'source.id',
      'source.ingestedAt',
      'source.kind',
      'source.lastModifiedMs',
      'source.mimeType',
      'source.publishedAt',
      'source.publisher',
      'source.requestedUrl',
      'source.sizeBytes',
      'sourceLabel',
      'sourceType',
      'title',
      'chunks.__typename',
      'chunks.content',
      'chunks.chunkIndex',
      'chunks.documentId',
      'chunks.id',
      'chunks.mentions.__typename',
      'chunks.mentions.chunkId',
      'chunks.mentions.endOffset',
      'chunks.mentions.entity.__typename',
      'chunks.mentions.entity.id',
      'chunks.mentions.entity.mentionCount',
      'chunks.mentions.entity.name',
      'chunks.mentions.entity.type',
      'chunks.mentions.entityId',
      'chunks.mentions.excerpt',
      'chunks.mentions.id',
      'chunks.mentions.startOffset',
    ].sort();

    expect(fieldPathsForFragment(DOCUMENT_EVIDENCE_VIEW, 'DocumentEvidenceView')).toEqual(expected);
  });

  it('GetDocumentEvidenceView query must reuse DocumentEvidenceView fragment', () => {
    const s = print(GET_DOCUMENT_EVIDENCE_VIEW_QUERY);
    expect(s).toContain('query GetDocumentEvidenceView');
    expect(s).toContain('...DocumentEvidenceView');
    expect(s).toContain('fragment DocumentEvidenceView on Document');
    expect(s).toContain('fragment DocumentCoreFields on Document');
    expect(s).toContain('fragment EntityMentionEvidenceFields on EntityMention');
    expect(s).toContain('fragment EntityCoreFields on Entity');
  });
});

