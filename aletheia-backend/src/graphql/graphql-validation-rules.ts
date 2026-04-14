/**
 * ADR-034: GraphQL operational validation rules (depth / selection budget).
 * Mechanical limits only — not semantic ranking.
 */
import { GraphQLError } from 'graphql';
import type { ASTVisitor, ValidationContext, ValidationRule } from 'graphql';
import depthLimitImport from 'graphql-depth-limit';
import { GQL_ERROR_CODES } from './errors/graphql-error-codes';

/** Default max field selections per operation (approximate cost budget). */
const DEFAULT_MAX_FIELD_SELECTIONS = 900;

const createDepthLimit = depthLimitImport as unknown as (
  maxDepth: number,
  options?: {
    ignore?: Array<string | RegExp | ((fieldName: string) => boolean)>;
  },
) => ValidationRule;

export const adr034DepthLimitRule: ValidationRule = createDepthLimit(14, {
  ignore: [/^__.*$/],
});

export function adr034QueryCostLimitRule(
  maxSelections = DEFAULT_MAX_FIELD_SELECTIONS,
) {
  return (context: ValidationContext): ASTVisitor => {
    let selections = 0;
    return {
      Field(node) {
        if (node.name.value.startsWith('__')) return;
        selections += 1;
        if (selections > maxSelections) {
          context.reportError(
            new GraphQLError(GQL_ERROR_CODES.QUERY_COST_EXCEEDED, {
              nodes: [node],
              extensions: { code: GQL_ERROR_CODES.QUERY_COST_EXCEEDED },
            }),
          );
        }
      },
    };
  };
}
