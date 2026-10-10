// fallow-ignore-file unused-file
import { defineConfig } from "oxfmt";

export default defineConfig({
  jsdoc: true,
  sortImports: true,
  sortTailwindcss: { stylesheet: "src/styles.css" },
  ignorePatterns: [".agents/**", ".claude/**", "src/routeTree.gen.ts", "pnpm-lock.yaml"],
});
