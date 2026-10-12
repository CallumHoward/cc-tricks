import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: [
    "typescript",
    "unicorn",
    "oxc",
    "react",
    "jsx-a11y",
    "import",
    "vitest",
    "promise",
    "jsdoc",
  ],
  jsPlugins: [
    "eslint-plugin-playwright",
    { name: "react-hooks-js", specifier: "eslint-plugin-react-hooks" },
    { name: "router", specifier: "@tanstack/eslint-plugin-router" },
    { name: "check-file", specifier: "eslint-plugin-check-file" },
    "eslint-plugin-testing-library",
    {
      name: "no-effect",
      specifier: "eslint-plugin-react-you-might-not-need-an-effect",
    },
  ],
  categories: {
    correctness: "error",
  },
  env: {
    builtin: true,
  },
  ignorePatterns: [
    ".output",
    "dist",
    ".agents/**",
    ".claude/**",
    "src/routeTree.gen.ts",
    "vitest-setup.ts",
  ],
  rules: {
    "unicorn/filename-case": ["error", { case: "kebabCase" }],
    "unicorn/no-null": "off",
    "react/only-export-components": "warn",
    "react/no-array-index-key": "error",

    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/await-thenable": "error",
    "typescript/switch-exhaustiveness-check": "error",
    "typescript/no-unnecessary-condition": "warn",

    "import/no-cycle": "error",

    // Consolidate on the `#/` src alias (Node subpath import); ban the old `@/`.
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            regex: "^@/",
            message: "Use the '#/' alias for src imports (the '@/' alias was removed).",
          },
        ],
      },
    ],

    "check-file/filename-blocklist": [
      "error",
      {
        "**/*.js": "*.ts",
        "**/*.jsx": "*.tsx",
        "**/*.mjs": "*.ts",
        "**/*.cjs": "*.ts",
        "**/__test*/**": "co-located *.test.ts (no __tests__ dirs)",
      },
    ],

    "check-file/filename-naming-convention": [
      "error",
      {
        "src/**/*.{ts,tsx}": "+([^.])?(.@(test|test-d|stories|d))",
        "e2e/**/*.{ts,tsx}": "+([^.])?(.@(spec))",
        "*.{ts,tsx}": "+([^.])?(.@(config|d))",
      },
      { ignoreMiddleExtensions: false },
    ],

    "jsdoc/check-tag-names": "error",
    "jsdoc/check-property-names": "error",
    "jsdoc/check-access": "error",
    "jsdoc/empty-tags": "error",
    "jsdoc/implements-on-classes": "error",

    // Native oxlint implementation: the JS-plugin variant (react-hooks-js/hooks)
    // does not catch conditional/looped hook calls, so use the native rule.
    "react-hooks/rules-of-hooks": "error",

    "react-hooks-js/hooks": "error",
    "react-hooks-js/capitalized-calls": "error",
    "react-hooks-js/component-hook-factories": "error",
    "react-hooks-js/no-deriving-state-in-effects": "error",
    "react-hooks-js/memo-dependencies": "error",
    // Newer/noisier effect-dependency rules: start as warnings.
    "react-hooks-js/memoized-effect-dependencies": "warn",
    "react-hooks-js/exhaustive-effect-dependencies": "warn",

    "react-hooks-js/static-components": "error",
    "react-hooks-js/use-memo": "error",
    "react-hooks-js/void-use-memo": "error",
    "react-hooks-js/preserve-manual-memoization": "error",
    "react-hooks-js/incompatible-library": "warn",
    "react-hooks-js/immutability": "error",
    "react-hooks-js/globals": "error",
    "react-hooks-js/refs": "error",
    "react-hooks-js/set-state-in-effect": "error",
    "react-hooks-js/error-boundaries": "error",
    "react-hooks-js/purity": "error",
    "react-hooks-js/set-state-in-render": "error",
    "react-hooks-js/unsupported-syntax": "warn",
    "react-hooks-js/config": "error",
    "react-hooks-js/gating": "error",

    // "You Might Not Need an Effect" rules (heuristic; start as warnings).
    // no-derived-state is omitted: it overlaps react-hooks-js/no-deriving-state-in-effects.
    "no-effect/no-chain-state-updates": "warn",
    "no-effect/no-event-handler": "warn",
    "no-effect/no-adjust-state-on-prop-change": "warn",
    "no-effect/no-reset-all-state-on-prop-change": "warn",
    "no-effect/no-pass-live-state-to-parent": "warn",
    "no-effect/no-pass-data-to-parent": "warn",
    "no-effect/no-external-store-subscription": "warn",
    "no-effect/no-initialize-state": "warn",
  },
  overrides: [
    {
      files: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}"],
      rules: {
        "vitest/require-top-level-describe": "error",
        "vitest/consistent-test-it": ["error", { fn: "it", withinDescribe: "it" }],
        "vitest/no-identical-title": "error",
        "vitest/no-commented-out-tests": "warn",
        "vitest/no-duplicate-hooks": "error",
        "vitest/prefer-hooks-in-order": "error",
        "vitest/prefer-hooks-on-top": "error",
        "vitest/require-hook": "error",

        "testing-library/await-async-queries": "error",
        "testing-library/await-async-utils": "error",
        "testing-library/no-await-sync-queries": "error",
        "testing-library/no-debugging-utils": "warn",
        "testing-library/no-dom-import": ["error", "react"],
        "testing-library/no-node-access": "error",
        "testing-library/no-promise-in-fire-event": "error",
        "testing-library/no-unnecessary-act": "error",
        "testing-library/no-wait-for-multiple-assertions": "error",
        "testing-library/no-wait-for-side-effects": "error",
        "testing-library/prefer-find-by": "error",
        "testing-library/prefer-presence-queries": "error",
        "testing-library/prefer-query-by-disappearance": "error",
        "testing-library/prefer-screen-queries": "error",
        "testing-library/prefer-user-event": "error",
        "testing-library/render-result-naming-convention": "error",
      },
    },
    {
      files: ["src/remotion/**/*.{ts,tsx}"],
      rules: {
        "react/only-export-components": "off",
      },
    },
    {
      files: ["src/routes/**/*.{ts,tsx}"],
      rules: {
        "react/only-export-components": "off",
        "router/create-route-property-order": "error",
        "router/route-param-names": "error",
        // Required for TanStack Router: route files ($postId, _layout, dotted
        // nesting) aren't kebab and their dots look like secondary extensions.
        "unicorn/filename-case": "off",
        "check-file/filename-naming-convention": "off",
      },
    },
    {
      files: ["e2e/**/*.{ts,tsx}"],
      rules: {
        "playwright/require-top-level-describe": "error",
        "playwright/no-skipped-test": "warn",
        "playwright/no-focused-test": "error",
        "playwright/no-conditional-in-test": "warn",
        "playwright/valid-expect": "error",
      },
    },
  ],
});
