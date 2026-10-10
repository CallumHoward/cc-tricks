import type { Config } from "stylelint";

const config: Config = {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [".agents/**", "dist/**", ".output/**", "node_modules/**"],
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  rules: {
    "declaration-no-important": true,
    "max-nesting-depth": [2, { ignoreAtRules: ["media", "supports", "layer"] }],
    "no-unknown-animations": true,
    "selector-max-id": 0,
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
