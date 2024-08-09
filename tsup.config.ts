import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    splitting: true,
  },
  {
    entry: ["src/cli.ts"],
    format: ["cjs"],
  },
]);
