import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "es2022",
  // The Postgres driver and Drizzle stay external; they are runtime dependencies
  // resolved by the consumer, not bundled into this package.
  external: [/^drizzle-orm/, "postgres"],
});
