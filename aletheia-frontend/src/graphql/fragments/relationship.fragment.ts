import { gql } from '@apollo/client';

import { ENTITY_FRAGMENT } from './entity.fragment';
import { EVIDENCE_FRAGMENT } from './evidence.fragment';

/**
 * EntityRelationship fragment (read-only inspection).
 *
 * Trust contract requirements:
 * - Relationship must link to evidence anchors
 * - `from`/`to` must be navigable entities
 */
export const RELATIONSHIP_FRAGMENT = gql`
  fragment RelationshipFragment on EntityRelationship {
    __typename
    id
    relation
    from {
      ...EntityFragment
    }
    to {
      ...EntityFragment
    }
    evidence {
      ...EvidenceFragment
    }
  }
  ${ENTITY_FRAGMENT}
  ${EVIDENCE_FRAGMENT}
`;

