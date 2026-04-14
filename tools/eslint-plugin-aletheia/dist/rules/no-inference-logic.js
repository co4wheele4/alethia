"use strict";
/**
 * ADR-022: Reject inference logic patterns.
 * - Math.max/Math.min on domain objects
 * - sort() on claims/evidence
 * - reduce() producing computed metrics
 * - comparator functions
 *
 * Derived semantics are forbidden (ADR-022)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.noInferenceLogic = void 0;
const DOMAIN_IDENTIFIERS = ['claim', 'claims', 'evidence', 'evidences'];
function isDomainArray(name) {
    const lower = name.toLowerCase();
    return DOMAIN_IDENTIFIERS.some((id) => lower.includes(id));
}
function getArrayVarName(node) {
    if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
        const prop = node.property.name;
        if (prop === 'sort' || prop === 'reduce') {
            if (node.object.type === 'Identifier') {
                return node.object.name;
            }
        }
    }
    return null;
}
exports.noInferenceLogic = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Reject inference logic: sort/reduce on domain objects, Math.max/min (ADR-022)',
            recommended: true,
            url: 'https://github.com/aletheia/docs/blob/main/adr/ADR-022-query-non-semantic-constraint.md',
        },
        schema: [],
        messages: {
            sortForbidden: "Derived semantics are forbidden (ADR-022). sort() on claims/evidence implies ranking.",
            reduceForbidden: "Derived semantics are forbidden (ADR-022). reduce() on domain objects may produce computed metrics.",
            mathMaxMin: "Derived semantics are forbidden (ADR-022). Math.max/Math.min on domain objects implies comparison.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                const callee = node.callee;
                if (callee.type === 'MemberExpression') {
                    const prop = callee.property;
                    if (prop.type === 'Identifier') {
                        if (prop.name === 'sort') {
                            const varName = getArrayVarName(callee);
                            const hasComparator = node.arguments.length > 0;
                            if ((varName && isDomainArray(varName)) || hasComparator) {
                                context.report({
                                    node,
                                    messageId: 'sortForbidden',
                                });
                            }
                        }
                        else if (prop.name === 'reduce') {
                            const varName = getArrayVarName(callee);
                            if (varName && isDomainArray(varName)) {
                                context.report({
                                    node,
                                    messageId: 'reduceForbidden',
                                });
                            }
                        }
                    }
                }
                if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
                    if (callee.object.name === 'Math' && callee.property.type === 'Identifier') {
                        if (callee.property.name === 'max' || callee.property.name === 'min') {
                            context.report({
                                node,
                                messageId: 'mathMaxMin',
                            });
                        }
                    }
                }
            },
        };
    },
};
