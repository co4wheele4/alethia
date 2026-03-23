/**
 * ADR-022: Reject identifiers containing forbidden derived-semantic terms.
 * Applies to variable names, function names, object properties.
 *
 * Derived semantics are forbidden (ADR-022)
 */

import type { Rule } from 'eslint';

const FORBIDDEN_TERMS = [
  'score',
  'confidence',
  'rank',
  'relevance',
  'strength',
  'weight',
  'priority',
];

function identifierContainsForbidden(name: string): string | null {
  const lower = name.toLowerCase();
  for (const term of FORBIDDEN_TERMS) {
    if (lower.includes(term)) {
      return term;
    }
  }
  return null;
}

export const noDerivedSemanticsIdentifiers: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Reject identifiers containing forbidden derived-semantic terms (ADR-022)',
      recommended: true,
      url: 'https://github.com/aletheia/docs/blob/main/adr/ADR-022-query-non-semantic-constraint.md',
    },
    schema: [],
    messages: {
      forbidden:
        "Derived semantics are forbidden (ADR-022). Identifier '{{name}}' contains '{{term}}'.",
    },
  },
  create(context) {
    function checkName(name: string, node: Rule.Node): void {
      if (!name || typeof name !== 'string') return;
      const term = identifierContainsForbidden(name);
      if (term) {
        context.report({
          node,
          messageId: 'forbidden',
          data: { name, term },
        });
      }
    }

    return {
      Identifier(node) {
        if (node.parent?.type === 'MemberExpression' && node.parent.property === node) {
          checkName(node.name, node);
        } else if (
          node.parent?.type !== 'MemberExpression' ||
          node.parent.object === node
        ) {
          checkName(node.name, node);
        }
      },
      Property(node) {
        if (node.key.type === 'Identifier') {
          checkName(node.key.name, node.key as Rule.Node);
        } else if (node.key.type === 'Literal' && typeof node.key.value === 'string') {
          checkName(node.key.value, node.key as Rule.Node);
        }
      },
      FunctionDeclaration(node) {
        if (node.id) {
          checkName(node.id.name, node.id as Rule.Node);
        }
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') {
          checkName(node.id.name, node.id as Rule.Node);
        }
      },
      FunctionExpression(node) {
        if (node.id) {
          checkName(node.id.name, node.id as Rule.Node);
        }
      },
      ArrowFunctionExpression(node) {
        const parent = (node as Rule.Node & { parent?: Rule.Node }).parent;
        if (parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
          checkName(parent.id.name, parent.id as Rule.Node);
        }
      },
    };
  },
};
