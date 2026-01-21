export { DOCUMENT_FRAGMENT } from './fragments/document.fragment';
export { ENTITY_FRAGMENT } from './fragments/entity.fragment';
export { MENTION_FRAGMENT } from './fragments/mention.fragment';
export { EVIDENCE_FRAGMENT } from './fragments/evidence.fragment';
export { RELATIONSHIP_FRAGMENT } from './fragments/relationship.fragment';

// Contract-minimal fragments (schema-faithful; confidence/probability forbidden)
export { DOCUMENT_CONTRACT_FRAGMENT } from './fragments/document.contract.fragment';
export { DOCUMENT_CHUNK_CONTRACT_FRAGMENT } from './fragments/documentChunk.contract.fragment';
export { ENTITY_CONTRACT_FRAGMENT } from './fragments/entity.contract.fragment';
export { ENTITY_MENTION_CONTRACT_FRAGMENT } from './fragments/entityMention.contract.fragment';
export { ENTITY_RELATIONSHIP_CONTRACT_FRAGMENT } from './fragments/entityRelationship.contract.fragment';

export { LIST_DOCUMENTS_QUERY } from './queries/listDocuments.query';
export { GET_DOCUMENT_BY_ID_QUERY } from './queries/getDocumentById.query';
export { LIST_ENTITIES_QUERY } from './queries/listEntities.query';
export { LIST_RELATIONSHIPS_QUERY } from './queries/listRelationships.query';

