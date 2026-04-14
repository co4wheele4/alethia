"use strict";
/**
 * ESLint plugin for Aletheia epistemic guardrails (ADR-022).
 *
 * Rules:
 * - no-derived-semantics-identifiers
 * - no-inference-logic
 * - no-evidence-transformation
 * - no-claim-comparison
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = void 0;
const no_derived_semantics_identifiers_1 = require("./rules/no-derived-semantics-identifiers");
const no_inference_logic_1 = require("./rules/no-inference-logic");
const no_evidence_transformation_1 = require("./rules/no-evidence-transformation");
const no_claim_comparison_1 = require("./rules/no-claim-comparison");
exports.rules = {
    'no-derived-semantics-identifiers': no_derived_semantics_identifiers_1.noDerivedSemanticsIdentifiers,
    'no-inference-logic': no_inference_logic_1.noInferenceLogic,
    'no-evidence-transformation': no_evidence_transformation_1.noEvidenceTransformation,
    'no-claim-comparison': no_claim_comparison_1.noClaimComparison,
};
const plugin = {
    meta: { name: 'eslint-plugin-aletheia', version: '1.0.0' },
    rules: exports.rules,
    configs: {
        get recommended() {
            return {
                plugins: { aletheia: plugin },
                rules: {
                    'aletheia/no-derived-semantics-identifiers': 'error',
                    'aletheia/no-inference-logic': 'error',
                    'aletheia/no-evidence-transformation': 'error',
                    'aletheia/no-claim-comparison': 'error',
                },
            };
        },
    },
};
exports.default = plugin;
