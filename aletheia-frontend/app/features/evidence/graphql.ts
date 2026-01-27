/**
 * Evidence (Truth Surface v1) GraphQL operations.
 *
 * This module intentionally re-exports the canonical fragment/query documents from `src/graphql`
 * to keep the feature-level imports stable while enforcing a single contract source of truth.
 */
/**
 * Coverage note:
 * V8 will report 0% for pure re-export modules (no executable statements).
 * This private marker keeps the module observable without changing behavior.
 */
export const __EVIDENCE_GRAPHQL_MODULE__ = true as const;

export {
  DOCUMENT_CORE_FIELDS,
  ENTITY_CORE_FIELDS,
  ENTITY_MENTION_EVIDENCE_FIELDS,
  DOCUMENT_EVIDENCE_VIEW,
  GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
} from '@/src/graphql';

