import { Config } from "@remotion/cli/config";

// Webpack (the default bundler) resolves the package.json "#/*" imports natively; rspack does not.
Config.setEntryPoint("./src/remotion/index.ts");
Config.setPublicDir("./public");
Config.setStudioPort(3001);
// Headless Chrome on macOS cannot create a WebGL context without ANGLE.
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");

type LoaderEntry = { loader?: string; options?: Record<string, unknown> };
type Rule = { use?: unknown; oneOf?: Rule[]; rules?: Rule[] };

// Root-absolute url()s (e.g. /fonts/*.woff2) point at the public dir at runtime, as in Vite.
function keepPublicUrls(rules: Rule[] = []) {
  for (const rule of rules) {
    if (Array.isArray(rule.use)) {
      for (const entry of rule.use as LoaderEntry[]) {
        if (entry.loader?.includes("css-loader")) {
          entry.options = {
            ...entry.options,
            url: { filter: (url: string) => !url.startsWith("/") },
          };
        }
      }
    }
    keepPublicUrls(rule.oneOf);
    keepPublicUrls(rule.rules);
  }
}

Config.overrideWebpackConfig((config) => {
  keepPublicUrls(config.module?.rules as Rule[] | undefined);
  return config;
});
