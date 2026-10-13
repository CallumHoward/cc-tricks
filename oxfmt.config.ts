// fallow-ignore-file unused-file
import { defineConfig } from "oxfmt";

export default defineConfig({
  jsdoc: true,
  sortImports: true,
  sortTailwindcss: { stylesheet: "src/styles.css" },
  // notes.md is a verbatim Notion export: tabs and list numbers must stay as written
  ignorePatterns: [
    ".agents/**",
    ".claude/**",
    "src/routeTree.gen.ts",
    "src/talk/notes.md",
    "pnpm-lock.yaml",
  ],
});
