import { GraphQLError, buildSchema, parse, validate } from 'graphql';
import type { FieldNode, ValidationContext } from 'graphql';
import {
  adr034DepthLimitRule,
  adr034QueryCostLimitRule,
} from './graphql-validation-rules';
import { GQL_ERROR_CODES } from './errors/graphql-error-codes';

describe('graphql-validation-rules (ADR-034)', () => {
  it('adr034DepthLimitRule rejects deeply nested field selections', () => {
    const nestLevels = 30;
    let schemaSDL = 'type Query { x: L0 }';
    for (let i = 0; i < nestLevels; i += 1) {
      schemaSDL += ` type L${i} { x: L${i + 1} }`;
    }
    schemaSDL += ` type L${nestLevels} { id: String }`;
    const schema = buildSchema(schemaSDL);

    let query = 'query { ';
    for (let i = 0; i < nestLevels; i += 1) {
      query += 'x { ';
    }
    query += 'id ';
    for (let i = 0; i < nestLevels; i += 1) {
      query += '} ';
    }
    query += '}';

    const errors = validate(schema, parse(query), [adr034DepthLimitRule]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message.toLowerCase()).toContain('depth');
  });

  it('adr034DepthLimitRule allows shallow queries under the budget', () => {
    const schema = buildSchema(`
      type Query { a: A }
      type A { b: B }
      type B { id: String }
    `);
    const errors = validate(schema, parse(`query { a { b { id } } }`), [
      adr034DepthLimitRule,
    ]);
    expect(errors).toEqual([]);
  });

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
