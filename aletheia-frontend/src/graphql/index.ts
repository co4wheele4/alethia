export { DOCUMENT_FRAGMENT } from './fragments/document.fragment';
export { ENTITY_FRAGMENT } from './fragments/entity.fragment';
export { MENTION_FRAGMENT } from './fragments/mention.fragment';
export { EVIDENCE_FRAGMENT } from './fragments/evidence.fragment';
export { RELATIONSHIP_FRAGMENT } from './fragments/relationship.fragment';

// Contract-minimal fragments (schema-faithful; confidence/probability forbidden)
export { DOCUMENT_CONTRACT_FRAGMENT } from './fragments/document.contract.fragment';
export { DOCUMENT_CORE_FRAGMENT } from './fragments/documentCore.fragment';
export { DOCUMENT_CHUNK_CONTRACT_FRAGMENT } from './fragments/documentChunk.contract.fragment';
export { ENTITY_CONTRACT_FRAGMENT } from './fragments/entity.contract.fragment';
export { ENTITY_MENTION_CONTRACT_FRAGMENT } from './fragments/entityMention.contract.fragment';
export { ENTITY_RELATIONSHIP_CONTRACT_FRAGMENT } from './fragments/entityRelationship.contract.fragment';

// Truth Surface v1 (Document → Evidence Viewer) fragments (prescriptive names)
export { DOCUMENT_CORE_FIELDS } from './fragments/documentCoreFields.fragment';
export { ENTITY_CORE_FIELDS } from './fragments/entityCoreFields.fragment';
export { ENTITY_MENTION_EVIDENCE_FIELDS } from './fragments/entityMentionEvidenceFields.fragment';
export { DOCUMENT_EVIDENCE_VIEW } from './fragments/documentEvidenceView.fragment';
// Prescriptive aliases requested by Evidence Inspection UI spec
export { DOCUMENT_EVIDENCE_FRAGMENT } from './fragments/documentEvidence.fragment';
export { ENTITY_MENTION_FRAGMENT } from './fragments/entityMention.fragment';
export { RELATIONSHIP_EVIDENCE_FRAGMENT } from './fragments/relationshipEvidence.fragment';
export { CLAIM_FIELDS, EVIDENCE_FIELDS } from './fragments/claim.fragment';
export { CLAIM_COMPARISON_ASSERTION_FIELDS, CLAIM_COMPARISON_EVIDENCE_FIELDS } from './fragments/ClaimComparison.fragment';

export { LIST_DOCUMENTS_QUERY } from './queries/listDocuments.query';
export { GET_DOCUMENT_BY_ID_QUERY } from './queries/getDocumentById.query';
export { GET_DOCUMENT_INTELLIGENCE_QUERY } from './queries/getDocumentIntelligence.query';
export { GET_DOCUMENT_EVIDENCE_VIEW_QUERY } from './queries/getDocumentEvidenceView.query';
export { DOCUMENTS_INDEX_QUERY } from './queries/documentsIndex.query';
export { LIST_ENTITIES_QUERY } from './queries/listEntities.query';
export { LIST_RELATIONSHIPS_QUERY } from './queries/listRelationships.query';
export { LIST_CLAIMS_QUERY } from './queries/listClaims.query';
export { CLAIMS_BY_DOCUMENT_QUERY } from './queries/claimsByDocument.query';
export { GET_CLAIMS_FOR_COMPARISON_QUERY } from './queries/getClaimsForComparison.query';
export { REVIEW_QUEUE_QUERY } from './queries/reviewQueue.query';
export { MY_REVIEW_REQUESTS_QUERY } from './queries/myReviewRequests.query';
export { REVIEW_REQUESTS_BY_CLAIM_QUERY } from './queries/reviewRequestsByClaim.query';
export { GET_EVIDENCE_DETAIL_QUERY } from './queries/evidenceDetail.query';
export { REVIEW_QUORUM_STATUS_QUERY } from './queries/reviewQuorumStatus.query';

export { ADJUDICATE_CLAIM_MUTATION } from './mutations/adjudicateClaim.mutation';
export { REQUEST_REVIEW_MUTATION } from './mutations/requestReview.mutation';
export { ASSIGN_REVIEWER_MUTATION } from './mutations/assignReviewer.mutation';
export { RESPOND_TO_REVIEW_ASSIGNMENT_MUTATION } from './mutations/respondToReviewAssignment.mutation';

export { REVIEW_REQUEST_FIELDS } from './fragments/reviewRequest.fragment';

