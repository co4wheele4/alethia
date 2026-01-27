import { print } from 'graphql';

import {
  __EVIDENCE_GRAPHQL_MODULE__,
  DOCUMENT_CORE_FIELDS,
  DOCUMENT_EVIDENCE_VIEW,
  ENTITY_CORE_FIELDS,
  ENTITY_MENTION_EVIDENCE_FIELDS,
  GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
} from '../graphql';

import {
  DOCUMENT_CORE_FIELDS as CANON_DOCUMENT_CORE_FIELDS,
  DOCUMENT_EVIDENCE_VIEW as CANON_DOCUMENT_EVIDENCE_VIEW,
  ENTITY_CORE_FIELDS as CANON_ENTITY_CORE_FIELDS,
  ENTITY_MENTION_EVIDENCE_FIELDS as CANON_ENTITY_MENTION_EVIDENCE_FIELDS,
  GET_DOCUMENT_EVIDENCE_VIEW_QUERY as CANON_GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
} from '@/src/graphql';

describe('features/evidence/graphql', () => {
  it('has a stable module marker (coverage / diagnostics)', () => {
    expect(__EVIDENCE_GRAPHQL_MODULE__).toBe(true);
  });

  it('re-exports the canonical GraphQL documents (identity)', () => {
    expect(DOCUMENT_CORE_FIELDS).toBe(CANON_DOCUMENT_CORE_FIELDS);
    expect(ENTITY_CORE_FIELDS).toBe(CANON_ENTITY_CORE_FIELDS);
    expect(ENTITY_MENTION_EVIDENCE_FIELDS).toBe(CANON_ENTITY_MENTION_EVIDENCE_FIELDS);
    expect(DOCUMENT_EVIDENCE_VIEW).toBe(CANON_DOCUMENT_EVIDENCE_VIEW);
    expect(GET_DOCUMENT_EVIDENCE_VIEW_QUERY).toBe(CANON_GET_DOCUMENT_EVIDENCE_VIEW_QUERY);
  });

  it('exports stable operation/fragment names', () => {
    expect(print(DOCUMENT_CORE_FIELDS)).toContain('fragment DocumentCoreFields');
    expect(print(ENTITY_CORE_FIELDS)).toContain('fragment EntityCoreFields');
    expect(print(ENTITY_MENTION_EVIDENCE_FIELDS)).toContain('fragment EntityMentionEvidenceFields');
    expect(print(DOCUMENT_EVIDENCE_VIEW)).toContain('fragment DocumentEvidenceView');
    expect(print(GET_DOCUMENT_EVIDENCE_VIEW_QUERY)).toContain('query GetDocumentEvidenceView');
  });
});

