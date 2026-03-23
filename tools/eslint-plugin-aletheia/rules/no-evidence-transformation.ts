/**
 * ADR-022: Reject evidence transformation.
 * - map/filter on evidence arrays that alters shape
 * - string manipulation of evidence content
 *
 * Evidence must be rendered EXACTLY as stored (ADR-020)
 */

import type { Rule } from 'eslint';

function referencesEvidence(node: Rule.Node | { type: string; name?: string; object?: unknown; property?: unknown }): boolean {
  if (node.type === 'Identifier') {
    const name = (node as { name: string }).name.toLowerCase();
    return name === 'evidence' || name === 'evidences' || name.includes('evidence');
  }
  if (node.type === 'MemberExpression' && (node as { object: { type: string } }).object?.type === 'Identifier') {
    const obj = node as { object: Rule.Node; property: Rule.Node };
    return referencesEvidence(obj.object) || referencesEvidence(obj.property);
  }
  return false;
}

export const noEvidenceTransformation: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Reject map/filter on evidence that alters shape; reject string manipulation of evidence (ADR-020/022)',
      recommended: true,
      url: 'https://github.com/aletheia/docs/blob/main/adr/ADR-020-evidence-rendering-source-fidelity.md',
    },
    schema: [],
    messages: {
      mapAltersShape:
        "Derived semantics are forbidden (ADR-022). Evidence must be rendered exactly as stored. map() that alters shape is prohibited.",
      stringManipulation:
        "Evidence must be rendered exactly as stored (ADR-020). String manipulation of evidence content is prohibited.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
          const prop = callee.property.name;
          const obj = callee.object;

          if (prop === 'map' && referencesEvidence(obj as Rule.Node)) {
            context.report({
              node,
              messageId: 'mapAltersShape',
            });
          }
        }

        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier'
        ) {
          const method = node.callee.property.name;
          if (
            (method === 'substring' || method === 'slice' || method === 'substr' || method === 'trim') &&
            node.callee.object.type === 'MemberExpression'
          ) {
            const memberObj = node.callee.object;
            if (
              memberObj.property.type === 'Identifier' &&
              (memberObj.property.name === 'snippet' ||
                memberObj.property.name === 'content' ||
                memberObj.property.name === 'excerpt')
            ) {
              context.report({
                node,
                messageId: 'stringManipulation',
              });
            }
          }
        }
      },
    };
  },
};
