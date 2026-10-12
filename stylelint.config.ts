import type { Config } from "stylelint";

const config: Config = {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [".agents/**", "coverage/**", "dist/**", ".output/**", "node_modules/**"],
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  rules: {
    "declaration-no-important": true,
    "max-nesting-depth": [2, { ignoreAtRules: ["media", "supports", "layer"] }],
    "no-unknown-animations": true,
    "selector-max-id": 0,
    // Kebab-case blocks with BEM elements (__) and modifiers (--) for component-scoped CSS
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      { message: "Expected kebab-case, optionally with BEM __element and --modifier" },
    ],
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "theme",
          "apply",
          "custom-variant",
          "variant",
          "utility",
          "source",
          "plugin",
          "reference",
          "config",
          "tailwind",
          "screen",
          "responsive",
        ],
      },
    ],
  },
};

export default config;
