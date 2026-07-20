import { hoodstackPreset } from "@hoodstack/design-tokens/tailwind";
import type { Config } from "tailwindcss";

/**
 * Tailwind's exported `Config` requires `content`, but a preset is by
 * definition partial - it contributes theme values and lets the consuming
 * config supply `content`. Tailwind has no exported type for that shape, so the
 * cast is asserting something true that the published types cannot express.
 */
const preset = hoodstackPreset as unknown as Partial<Config>;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [preset as Config],
} satisfies Config;
