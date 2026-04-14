import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { of, throwError, firstValueFrom } from 'rxjs';
import { GraphQLError } from 'graphql';
import { EpistemicAuditInterceptor } from './epistemic-audit.interceptor';
import { GQL_ERROR_CODES } from '../graphql/errors/graphql-error-codes';

describe('EpistemicAuditInterceptor', () => {
  it('passes through non-graphql', async () => {
    const prisma = { epistemicEvent: { create: jest.fn() } };
    const i = new EpistemicAuditInterceptor(prisma as any);
    const ctx = { getType: () => 'http' } as ExecutionContext;
    const v = await firstValueFrom(
      i.intercept(ctx, { handle: () => of('ok') }),
    );
    expect(v).toBe('ok');
  });

  it('logs audited GraphQL errors', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = { epistemicEvent: { create } };
    const i = new EpistemicAuditInterceptor(prisma as any);

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user: { sub: 'u1' } } }),
    } as ReturnType<typeof GqlExecutionContext.create>);

    const ctx = {
      getType: () => 'graphql',
    } as ExecutionContext;

    const err = new GraphQLError('x', {
      extensions: { code: GQL_ERROR_CODES.DERIVED_SEMANTICS_FORBIDDEN },
    });

    await expect(
      firstValueFrom(
        i.intercept(ctx, {
          handle: () => throwError(() => err),
        }),
      ),
    ).rejects.toBe(err);

    await new Promise((r) => setTimeout(r, 20));
    expect(create).toHaveBeenCalled();
  });

  it('uses null actor when user missing', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = { epistemicEvent: { create } };
    const i = new EpistemicAuditInterceptor(prisma as any);

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: {} }),
    } as ReturnType<typeof GqlExecutionContext.create>);

    const ctx = { getType: () => 'graphql' } as ExecutionContext;
    const err = new GraphQLError('x', {
      extensions: { code: GQL_ERROR_CODES.DERIVED_SEMANTICS_FORBIDDEN },
    });

    await expect(
      firstValueFrom(
        i.intercept(ctx, {
          handle: () => throwError(() => err),
        }),
      ),
    ).rejects.toBe(err);

    await new Promise((r) => setTimeout(r, 20));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorId: null }),
      }),
    );
  });

  it('uses user id when sub absent', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = { epistemicEvent: { create } };
    const i = new EpistemicAuditInterceptor(prisma as any);

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user: { id: 'u2' } } }),
    } as ReturnType<typeof GqlExecutionContext.create>);

    const ctx = { getType: () => 'graphql' } as ExecutionContext;
    const err = new GraphQLError('x', {
      extensions: { code: GQL_ERROR_CODES.DERIVED_SEMANTICS_FORBIDDEN },
    });

    await expect(
      firstValueFrom(
        i.intercept(ctx, {
          handle: () => throwError(() => err),
        }),
      ),
    ).rejects.toBe(err);

    await new Promise((r) => setTimeout(r, 20));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorId: 'u2' }),
      }),
    );
  });

  it('swallows audit persistence failures', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db'));
    const prisma = { epistemicEvent: { create } };
    const i = new EpistemicAuditInterceptor(prisma as any);

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user: { sub: 'u1' } } }),
    } as ReturnType<typeof GqlExecutionContext.create>);

    const ctx = { getType: () => 'graphql' } as ExecutionContext;
    const err = new GraphQLError('x', {
      extensions: { code: GQL_ERROR_CODES.DERIVED_SEMANTICS_FORBIDDEN },
    });

    await expect(
      firstValueFrom(
        i.intercept(ctx, {
          handle: () => throwError(() => err),
        }),
      ),
    ).rejects.toBe(err);

    await new Promise((r) => setTimeout(r, 30));
    expect(create).toHaveBeenCalled();
  });
});
