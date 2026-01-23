import { gql } from '@apollo/client';

import { DOCUMENT_CORE_FIELDS } from './documentCoreFields.fragment';
import { ENTITY_MENTION_EVIDENCE_FIELDS } from './entityMentionEvidenceFields.fragment';

/**
 * Truth Surface v1 read model:
 * Document → Chunks (ground truth text) → Mentions (offset anchors) → Entities.
 *
 * This fragment is deliberately evidence-first (ADR-004) and schema-faithful (ADR-005).
 */
export const DOCUMENT_EVIDENCE_VIEW = gql`
  fragment DocumentEvidenceView on Document {
    ...DocumentCoreFields
    chunks {
      __typename
      id
      chunkIndex
      content
      documentId
      mentions {
        ...EntityMentionEvidenceFields
      }
    }
  }
  ${DOCUMENT_CORE_FIELDS}
  ${ENTITY_MENTION_EVIDENCE_FIELDS}
`;

