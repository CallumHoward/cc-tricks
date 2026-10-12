import { Config } from "@remotion/cli/config";

// Webpack (the default bundler) resolves the package.json "#/*" imports natively; rspack does not.
Config.setEntryPoint("./src/remotion/index.ts");
Config.setPublicDir("./public");
Config.setStudioPort(3001);
// Headless Chrome on macOS cannot create a WebGL context without ANGLE.
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
