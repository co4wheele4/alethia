import { graphql, HttpResponse } from 'msw';

import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';
import { buildRelationships } from '@/src/test/msw/buildRelationships';

export const relationshipHandlers = [
  graphql.query('ListRelationships', () => {
    const data = { entityRelationships: buildRelationships() };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

