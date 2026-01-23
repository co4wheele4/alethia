/**
 * Evidence (Truth Surface v1) GraphQL operations.
 *
 * This module intentionally re-exports the canonical fragment/query documents from `src/graphql`
 * to keep the feature-level imports stable while enforcing a single contract source of truth.
 */
export {
  DOCUMENT_CORE_FIELDS,
  ENTITY_CORE_FIELDS,
  ENTITY_MENTION_EVIDENCE_FIELDS,
  DOCUMENT_EVIDENCE_VIEW,
  GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
} from '@/src/graphql';

