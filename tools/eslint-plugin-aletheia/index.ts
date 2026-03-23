/**
 * ESLint plugin for Aletheia epistemic guardrails (ADR-022).
 *
 * Rules:
 * - no-derived-semantics-identifiers
 * - no-inference-logic
 * - no-evidence-transformation
 * - no-claim-comparison
 */

import { noDerivedSemanticsIdentifiers } from './rules/no-derived-semantics-identifiers';
import { noInferenceLogic } from './rules/no-inference-logic';
import { noEvidenceTransformation } from './rules/no-evidence-transformation';
import { noClaimComparison } from './rules/no-claim-comparison';

export const rules = {
  'no-derived-semantics-identifiers': noDerivedSemanticsIdentifiers,
  'no-inference-logic': noInferenceLogic,
  'no-evidence-transformation': noEvidenceTransformation,
  'no-claim-comparison': noClaimComparison,
};

const plugin = {
  meta: { name: 'eslint-plugin-aletheia', version: '1.0.0' },
  rules,
  configs: {
    get recommended() {
      return {
        plugins: { aletheia: plugin },
        rules: {
          'aletheia/no-derived-semantics-identifiers': 'error' as const,
          'aletheia/no-inference-logic': 'error' as const,
          'aletheia/no-evidence-transformation': 'error' as const,
          'aletheia/no-claim-comparison': 'error' as const,
        },
      };
    },
  },
};

export default plugin;
