/**
 * ADR-022: Query Non-Semantic Constraint — Resolver Guard
 *
 * Inspects GraphQL request (args, variables, query document) and rejects if it contains
 * forbidden derived-semantic terms: orderBy, sort, compare, score, rank, confidence.
 *
 * Throw: GraphQLError with code DERIVED_SEMANTICS_FORBIDDEN
 */

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

const FORBIDDEN_TERMS = [
  'orderBy',
  'sort',
  'compare',
  'score',
  'rank',
  'confidence',
];

function checkObject(obj: unknown, path: string): string[] {
  const violations: string[] = [];
  if (obj === null || obj === undefined) return violations;

  if (typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      for (const term of FORBIDDEN_TERMS) {
        if (keyLower.includes(term)) {
          violations.push(
            `Variable/arg "${path}${key}" contains forbidden term "${term}"`,
          );
        }
      }
      violations.push(...checkObject(value, `${path}${key}.`));
    }
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      violations.push(...checkObject(item, `${path}[${i}].`));
    });
  }

  return violations;
}

function checkQueryDocument(query: string): string[] {
  const violations: string[] = [];
  const q = query;

  // Match as GraphQL names (field/arg names), not inside strings.
  if (/\bcompare\w*\s*\(/.test(q) || /query\s+\w*[Cc]ompare/.test(q)) {
    violations.push('Query document contains forbidden "compare*" operation');
  }
  if (/\borderBy\s*:/i.test(q))
    violations.push('Query document contains forbidden "orderBy" argument');
  if (/\bsort\s*:/i.test(q))
    violations.push('Query document contains forbidden "sort" argument');
  if (/\bscore\s*[{\s:]/.test(q))
    violations.push('Query document requests forbidden "score" field');
  if (/\brank\s*[{\s:]/.test(q))
    violations.push('Query document requests forbidden "rank" field');
  if (/\bconfidence\s*[{\s:]/.test(q))
    violations.push('Query document requests forbidden "confidence" field');

  return violations;
}

@Injectable()
export class AssertNoDerivedSemanticsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const type = context.getType<string>();
    if (type !== 'graphql') return true;

    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext<{ req?: { body?: unknown } }>();
    const req = ctx?.req;
    const body = req?.body;

    if (!body || typeof body !== 'object') return true;

    const variables = (body as { variables?: unknown }).variables;
    const query = (body as { query?: string }).query;

    const violations: string[] = [];

    if (variables) {
      violations.push(...checkObject(variables, ''));
    }

    if (typeof query === 'string') {
      violations.push(...checkQueryDocument(query));
    }

    if (violations.length > 0) {
      throw new GraphQLError(GQL_ERROR_CODES.DERIVED_SEMANTICS_FORBIDDEN, {
        extensions: { code: GQL_ERROR_CODES.DERIVED_SEMANTICS_FORBIDDEN },
      });
    }

    return true;
  }
}
