import config, { browserSafeBoundaries } from "@hoodstack/eslint-config";

export default [
  ...config,
  {
    // Packages that ship to a browser. The boundary rules are the control that
    // keeps server credentials out of client bundles.
    ...browserSafeBoundaries,
    files: [
      "packages/network/src/**/*.ts",
      "packages/errors/src/**/*.ts",
      "packages/config/src/**/*.ts",
      "packages/design-tokens/src/**/*.ts",
      "packages/ui/src/**/*.{ts,tsx}",
      "packages/sdk/src/**/*.ts",
      "packages/react/src/**/*.{ts,tsx}",
    ],
    // Tests are never bundled, and some legitimately need Node APIs - reading a
    // stylesheet off disk to verify it against the TypeScript tokens, say.
    ignores: ["**/*.test.{ts,tsx}"],
  },
];
