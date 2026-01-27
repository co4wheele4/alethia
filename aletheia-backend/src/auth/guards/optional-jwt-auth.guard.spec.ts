import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getRequest returns the GraphQL req', () => {
    const guard = new OptionalJwtAuthGuard();
    const req = {} as Request;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req }),
    } as any);

    const ctx = {} as ExecutionContext;
    expect(guard.getRequest(ctx)).toBe(req);
  });

  it('handleRequest returns user when present', () => {
    const guard = new OptionalJwtAuthGuard();
    expect(
      guard.handleRequest(
        null,
        { id: 'u1' } as any,
        null,
        {} as ExecutionContext,
      ),
    ).toEqual({ id: 'u1' });
  });

  it('handleRequest returns null when missing/invalid', () => {
    const guard = new OptionalJwtAuthGuard();
    expect(
      guard.handleRequest(
        new Error('bad token'),
        null,
        null,
        {} as ExecutionContext,
      ),
    ).toBeNull();
  });
});
