module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  extends: [
    "expo",
    "plugin:@tanstack/eslint-plugin-query/recommended",
  ],
  plugins: ["@tanstack/query"],
  rules: {
    // TypeScript
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",

    // React
    "react/react-in-jsx-scope": "off",
    "react-hooks/exhaustive-deps": "warn",

    // React Query
    "@tanstack/query/exhaustive-deps": "warn",
    "@tanstack/query/no-rest-destructuring": "warn",

    // General
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "warn",
  },
  ignorePatterns: [
    "node_modules/",
    ".expo/",
    "android/",
    "ios/",
    "dist/",
    "*.config.js",
    "jest.setup.js",
  ],
};
