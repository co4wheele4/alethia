"use strict";
/**
 * ADR-022: Reject comparisons between claims.
 * Example (INVALID): if (claimA.evidence.length > claimB.evidence.length)
 *
 * Derived semantics are forbidden (ADR-022)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noClaimComparison = void 0;
function isClaimIdentifier(name) {
    const lower = name.toLowerCase();
    return lower === 'claim' || lower === 'claims' || (lower.includes('claim') && lower.length <= 10);
}
function looksLikeClaimComparison(node) {
    if (node.type !== 'BinaryExpression')
        return false;
    const op = node.operator;
    if (op !== '>' && op !== '<' && op !== '>=' && op !== '<=' && op !== '===' && op !== '!==' && op !== '==' && op !== '!=') {
        return false;
    }
    function getLeafIdentifier(n) {
        if (n.type === 'Identifier')
            return n.name;
        if (n.type === 'MemberExpression') {
            return getLeafIdentifier(n.object);
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
exports.noClaimComparison = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Reject comparisons between claims (ADR-022)',
            recommended: true,
            url: 'https://github.com/aletheia/docs/blob/main/adr/ADR-022-query-non-semantic-constraint.md',
        },
        schema: [],
        messages: {
            comparisonForbidden: "Derived semantics are forbidden (ADR-022). Comparisons between claims are prohibited.",
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
