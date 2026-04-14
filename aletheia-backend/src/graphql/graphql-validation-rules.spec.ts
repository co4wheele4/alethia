import { GraphQLError } from 'graphql';
import type { FieldNode, ValidationContext } from 'graphql';
import { adr034QueryCostLimitRule } from './graphql-validation-rules';
import { GQL_ERROR_CODES } from './errors/graphql-error-codes';

describe('graphql-validation-rules (ADR-034)', () => {
  it('adr034QueryCostLimitRule reports QUERY_COST_EXCEEDED when budget is exceeded', () => {
    const reported: GraphQLError[] = [];
    const context = {
      reportError: (e: GraphQLError) => {
        reported.push(e);
      },
    } as unknown as ValidationContext;

    const rule = adr034QueryCostLimitRule(2);
    const visitor = rule(context) as {
      Field?: (node: FieldNode) => void;
    };
    const field = (name: string): FieldNode =>
      ({ name: { value: name } }) as FieldNode;

    visitor.Field?.(field('a'));
    visitor.Field?.(field('b'));
    visitor.Field?.(field('c'));

    expect(reported.length).toBeGreaterThan(0);
    expect(reported[0].message).toBe(GQL_ERROR_CODES.QUERY_COST_EXCEEDED);
  });

  it('adr034QueryCostLimitRule ignores introspection fields', () => {
    const reported: GraphQLError[] = [];
    const context = {
      reportError: (e: GraphQLError) => {
        reported.push(e);
      },
    } as unknown as ValidationContext;

    const rule = adr034QueryCostLimitRule(1);
    const visitor = rule(context) as {
      Field?: (node: FieldNode) => void;
    };
    const field = (name: string): FieldNode =>
      ({ name: { value: name } }) as FieldNode;

    visitor.Field?.(field('__schema'));
    visitor.Field?.(field('x'));

    expect(reported.length).toBe(0);
  });
});
