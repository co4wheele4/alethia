import { graphql, HttpResponse } from 'msw';

import { fixture } from '@/src/mocks/aletheia-fixtures';
import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';

export const entityHandlers = [
  graphql.query('ListEntities', () => {
    const data = { entities: fixture.entities };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

