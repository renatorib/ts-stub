import path from "path";
import { program } from "@commander-js/extra-typings";
import { stub } from "./stub.js";
import { version } from "../package.json";

export const command = program
  .name("ts-stub")
  .description("Stub your build to improve monorepo DX")
  .version(version)
  .argument("[cwd_directory]")
  .option("-i, --input [file]", "Input typescript file path", "src/index.ts")
  .option("-o, --output [dir]", "Output stub directory", "dist")
  .option("--noEmit", "Disable emitting declaration files", false)
  .option(
    "-f, --format [format]",
    [
      'Output format and extension. Can be "esm", "esm:js", "cjs" and "cjs:js"',
      'Default extension for "esm" and "cjs" are ".mjs" and ".cjs"',
    ].join("\n"),
  )
  .option("-c, --clear", "Clear output folder before stubbing", false)
  .option("-q, --quiet", "Prevent any output to stdout", false)
  .option("--noEffects", "Disable any file system mutations", false)
  .addHelpText(
    "after",
    [
      "",
      "Examples:",
      "  $ ts-stub --clear",
      "  $ ts-stub --clear --quiet",
      "  $ ts-stub --clear packages/a",
      "  $ ts-stub --clear --input=src/main.ts --output=build --format=cjs",
    ].join("\n"),
  )
  .action((dir, { input, output, format, noEmit, noEffects, quiet, clear }) => {
    stub({
      entry: {
        input: typeof input === "string" ? input : undefined,
        output: typeof output === "string" ? output : undefined,
        format: typeof format === "string" ? format : undefined,
        noEmit: noEmit,
      },
      cwd: typeof dir === "string" ? path.join(process.cwd(), dir) : undefined,
      quiet,
      clear,
      noEffects,
    });
  });
