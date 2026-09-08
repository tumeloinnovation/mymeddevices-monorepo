const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// The pnpm virtual-store hoist exposes single copies of `react`/`react-native`
// across the monorepo, and sibling apps pin different versions (the driver app
// is on RN 0.86 / react 19.2, this app on RN 0.81 / react 19.1). Force every
// bare `react`/`react-dom`/`react-native` import — including from inside
// node_modules that have no react link of their own and would otherwise fall
// back to the shared hoist — to resolve from this app's node_modules so the
// bundle never mixes versions.
// Gradle/codegen outputs inside node_modules (e.g. the foreign
// react-native-gesture-handler copy under .pnpm) are deleted and recreated
// while Metro runs. Metro's Linux fallback watcher races that deletion and
// dies with ENOENT during its initial crawl, so keep all android build dirs
// out of the file map and watcher entirely.
config.resolver.blockList = [
  ...(config.resolver.blockList ?? []),
  /.*[/\\]android[/\\]build[/\\].*/,
];

const RESOLVE_FROM = path.join(__dirname, "package.json");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react" ||
    moduleName.startsWith("react/") ||
    moduleName === "react-dom" ||
    moduleName.startsWith("react-dom/") ||
    moduleName === "react-native" ||
    moduleName.startsWith("react-native/")
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: RESOLVE_FROM },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
