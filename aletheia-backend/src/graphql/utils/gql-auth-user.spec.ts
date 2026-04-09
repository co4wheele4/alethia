import { getGqlAuthUserId } from './gql-auth-user';

describe('getGqlAuthUserId', () => {
  it('prefers sub when present', () => {
    expect(getGqlAuthUserId({ req: { user: { sub: 'a', id: 'b' } } })).toBe(
      'a',
    );
  });

  it('falls back to id', () => {
    expect(getGqlAuthUserId({ req: { user: { id: 'u1' } } })).toBe('u1');
  });

  it('returns undefined when missing', () => {
    expect(getGqlAuthUserId(undefined)).toBeUndefined();
  });
});
