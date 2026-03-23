import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { AssertNoDerivedSemanticsGuard } from './assertNoDerivedSemantics';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

describe('AssertNoDerivedSemanticsGuard', () => {
  let guard: AssertNoDerivedSemanticsGuard;
  let mockGqlContext: jest.MockedFunction<typeof GqlExecutionContext.create>;

  beforeEach(() => {
    guard = new AssertNoDerivedSemanticsGuard();
    mockGqlContext = GqlExecutionContext.create as jest.MockedFunction<
      typeof GqlExecutionContext.create
    >;
  });

  function createContext(
    body?: { query?: string; variables?: unknown },
  ): ExecutionContext {
    const ctx = {
      getType: () => 'graphql',
      switchToHttp: () => ({}),
    } as unknown as ExecutionContext;
    const gqlCtx = {
      getContext: () => ({ req: body ? { body } : {} }),
    };
    mockGqlContext.mockReturnValue(gqlCtx as any);
    return ctx;
  }

  it('returns true for non-graphql context', async () => {
    const ctx = {
      getType: () => 'http',
    } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
    expect(mockGqlContext).not.toHaveBeenCalled();
  });

  it('returns true when body is empty', () => {
    const ctx = createContext(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when no violations in query and variables', () => {
    const ctx = createContext({
      query: 'query { claims { id } }',
      variables: {},
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('handles variables with null values without rejecting', () => {
    const ctx = createContext({
      query: 'query { claims { id } }',
      variables: { x: null, items: [null] },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws when variables contain forbidden term score', () => {
    const ctx = createContext({
      query: 'query GetClaims { claims { id } }',
      variables: { score: 0.9 },
    });
    expect(() => guard.canActivate(ctx)).toThrow(GraphQLError);
    expect(() => guard.canActivate(ctx)).toThrow(
      GQL_ERROR_CODES.DERIVED_SEMANTICS_FORBIDDEN,
    );
  });

  it('throws when query contains orderBy', () => {
    const ctx = createContext({
      query: 'query { claims(orderBy: createdAt) { id } }',
    });
    expect(() => guard.canActivate(ctx)).toThrow(GraphQLError);
  });

  it('throws when query requests score field', () => {
    const ctx = createContext({
      query: 'query { claim { id score } }',
    });
    expect(() => guard.canActivate(ctx)).toThrow(GraphQLError);
  });

  it('throws when query requests rank field', () => {
    const ctx = createContext({
      query: 'query { claim { id rank } }',
    });
    expect(() => guard.canActivate(ctx)).toThrow(GraphQLError);
  });

  it('throws when query requests confidence field', () => {
    const ctx = createContext({
      query: 'query { claim { id confidence } }',
    });
    expect(() => guard.canActivate(ctx)).toThrow(GraphQLError);
  });

  it('throws when variables contain forbidden term in nested array', () => {
    const ctx = createContext({
      query: 'query { claims { id } }',
      variables: { items: [{ score: 0.5 }] },
    });
    expect(() => guard.canActivate(ctx)).toThrow(GraphQLError);
  });

  it('throws when query contains sort argument', () => {
    const ctx = createContext({
      query: 'query { claims(sort: "createdAt") { id } }',
    });
    expect(() => guard.canActivate(ctx)).toThrow(GraphQLError);
  });

  it('throws when query contains compare operation', () => {
    const ctx = createContext({
      query: 'query CompareClaims { claims { id } }',
    });
    expect(() => guard.canActivate(ctx)).toThrow(GraphQLError);
  });
});
