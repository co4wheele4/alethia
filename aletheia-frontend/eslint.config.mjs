import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow setState in useEffect for initializing state from localStorage (SSR-safe hydration)
      // This is necessary to prevent hydration mismatches when reading from localStorage
      'react-hooks/set-state-in-effect': 'warn', // Downgrade to warning for hydration patterns
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}", "e2e/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    // Ignore backend directories
    "../aletheia-backend/**",
    "../node_modules/**",
  ]),
]);

export default eslintConfig;
