/**
 * ADR-022: Reject comparisons between claims.
 * Example (INVALID): if (claimA.evidence.length > claimB.evidence.length)
 *
 * Derived semantics are forbidden (ADR-022)
 */

import type { Rule } from 'eslint';

function isClaimIdentifier(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === 'claim' || lower === 'claims' || (lower.includes('claim') && lower.length <= 10);
}

function looksLikeClaimComparison(node: Rule.Node): boolean {
  if (node.type !== 'BinaryExpression') return false;
  const op = node.operator;
  if (op !== '>' && op !== '<' && op !== '>=' && op !== '<=' && op !== '===' && op !== '!==' && op !== '==' && op !== '!=') {
    return false;
  }

  function getLeafIdentifier(n: Rule.Node | { type: string; object?: unknown; name?: string }): string | null {
    if (n.type === 'Identifier') return (n as { name: string }).name;
    if (n.type === 'MemberExpression') {
      return getLeafIdentifier((n as { object: Rule.Node }).object);
    }
    return null;
  }

  const left = getLeafIdentifier(node.left);
  const right = getLeafIdentifier(node.right);
  if (left && right && isClaimIdentifier(left) && isClaimIdentifier(right) && left !== right) {
    return true;
  }
  return false;
}

export const noClaimComparison: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Reject comparisons between claims (ADR-022)',
      recommended: true,
      url: 'https://github.com/aletheia/docs/blob/main/adr/ADR-022-query-non-semantic-constraint.md',
    },
    schema: [],
    messages: {
      comparisonForbidden:
        "Derived semantics are forbidden (ADR-022). Comparisons between claims are prohibited.",
    },
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (looksLikeClaimComparison(node)) {
          context.report({
            node,
            messageId: 'comparisonForbidden',
          });
        }
      },
    };
  },
};
