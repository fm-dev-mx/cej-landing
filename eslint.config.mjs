import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const reactPlugin = require("eslint-plugin-react");
const importPlugin = require("eslint-plugin-import");

const eslintConfig = defineConfig([
  ...fixupConfigRules(nextVitals),
  ...fixupConfigRules(nextTs),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rule overrides
  {
    files: ["components/Calculator/hooks/useCalculatorState.ts"],
    rules: {
      // Allow specific hydration pattern from localStorage
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    plugins: {
      react: fixupPluginRules(reactPlugin),
      import: fixupPluginRules(importPlugin)
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
      "import/no-cycle": "error"
    },
  },
]);

export default eslintConfig;
