import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSchema, validate } from 'graphql';

import {
  GET_DOCUMENT_BY_ID_QUERY,
  ADJUDICATE_CLAIM_MUTATION,
  DOCUMENTS_INDEX_QUERY,
  LIST_DOCUMENTS_QUERY,
  LIST_ENTITIES_QUERY,
  LIST_RELATIONSHIPS_QUERY,
} from '@/src/graphql';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadSchemaSDL() {
  // Single authoritative schema snapshot for contract validation.
  // (Monorepo root) /src/schema.gql
  const schemaPath = path.join(__dirname, '../../../../src/schema.gql');
  return readFileSync(schemaPath, 'utf-8');
}

describe('GraphQL contract layer', () => {
  const schema = buildSchema(loadSchemaSDL());

  test.each([
    ['ListDocuments', LIST_DOCUMENTS_QUERY],
    ['DocumentsIndex', DOCUMENTS_INDEX_QUERY],
    ['GetDocumentById', GET_DOCUMENT_BY_ID_QUERY],
    ['ListEntities', LIST_ENTITIES_QUERY],
    ['ListRelationships', LIST_RELATIONSHIPS_QUERY],
    ['AdjudicateClaim', ADJUDICATE_CLAIM_MUTATION],
  ])('%s validates against schema snapshot', (_, doc) => {
    const errors = validate(schema, doc);
    expect(errors).toEqual([]);
  });
});

