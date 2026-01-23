import { gql } from '@apollo/client';

import { DOCUMENT_CORE_FIELDS } from './documentCoreFields.fragment';
import { ENTITY_MENTION_EVIDENCE_FIELDS } from './entityMentionEvidenceFields.fragment';

/**
 * Evidence inspection fragment (prescriptive name; ADR-005).
 *
 * NOTE:
 * - Schema-faithful: fields must exist in `/src/schema.gql`
 * - Confidence/probability is forbidden (ADR-006)
 */
export const DOCUMENT_EVIDENCE_FRAGMENT = gql`
  fragment DocumentEvidenceFragment on Document {
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

