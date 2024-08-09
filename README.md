<h1 align="center">

![ts-stub](.github/assets/ts-stub-dark-logo.svg#gh-dark-mode-only)
![ts-stub](.github/assets/ts-stub-light-logo.svg#gh-light-mode-only)

</h1>

<p align="center">
  <a href="https://npmjs.com/package/ts-stub">
    <img src="https://img.shields.io/npm/v/ts-stub.svg?v=1" alt="npm package">
  </a>
</p>

<p align="center">
  Stub your build and <strong>never</strong> <em>watch & rebuild</em> ever again.
</p>

<p align="center">
  <a href="#-getting-started">Getting Started</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#-documentation">Documentation</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#-developer-api">Developer API</a>
</p>

<br>

## Why?

#### ❌ The _watch & rebuild_ problem

When working with workspaces _(ie multiple packages in a repository)_ even though you link a package from your local file system, the module resolution still depends on your <kbd>package.json</kbd> exports/main which usually points to the code's **bundled directory** _(eg <kbd>dist/</kbd>, <kbd>build/</kbd>, <kbd>lib/</kbd>, etc)_.

This way you still need the source code to be bundled so that some other package can consume it, even locally. The most common way to get around this inconvenience is with _watch & rebuild_, triggering the build when some source file changes. You will need a background process to watch the file changes and might experience some delay to changes be applied _(including the types that depends on build .d.ts)_

#### ✔ The stubbing solution

The ideia is to create a different build output on development that works like a **bridge** between your <kbd>package.json</kbd> exports/main resolution and your source file.

<p align="center">
  <img alt="diagram" src=".github/assets/diagram-dark.png#gh-dark-mode-only" align="center" />
  <img alt="diagram" src=".github/assets/diagram-light.png#gh-light-mode-only" align="center" />
</p>

<br>
<br>
<br>

## 👉 Getting started

> [!NOTE]  
> `ts-stub` is made to be used in workspaces/multi-package repos (aka monorepos).  
> Otherwise it will **not** bring any benefit, unless you do manual symlinks through your local repos.

> **TL;DR**  
> Add `{ "stub": "ts-stub --clear" }` script to all packages and execute all at once.

<br>

### `1` Install _ts-stub_ with your package manager

```sh
pnpm add -D ts-stub
# npm install --save-dev ts-stub
```

<br>

### `2` Add a separate build script to stubbing your packages

<kbd>packages/a/package.json</kbd>

```diff
{
  "name": "package-a",
  "scripts": {
    "build": "tsup",
+   "stub": "ts-stub --clear"
  }
}
```

<kbd>packages/b/package.json</kbd>

```diff
{
  "name": "package-b",
  "scripts": {
    "build": "tsup",
+   "stub": "ts-stub --clear"
  }
}
```

<br>

### `3` Stub all at once

Use your favorite tool to execute all packages stub script (like <kbd>pnpm -r</kbd>, <kbd>turbo</kbd>, <kbd>lerna</kbd>, <kbd>nx</kbd>, etc.)

```sh
pnpm -r stub
```

```sh
packages/a stub$ ts-stub --clear
│ ✓ Cleaned …my-monorepo/packages/a/dist
│ ✓ Stubbed …e/packages/a/dist/index.mjs
│ ✓ Stubbed …/packages/a/dist/index.d.ts
└─ Done in 242ms
packages/b stub$ ts-stub --clear
│ ✓ Cleaned …my-monorepo/packages/b/dist
│ ✓ Stubbed …e/packages/b/dist/index.mjs
│ ✓ Stubbed …/packages/b/dist/index.d.ts
└─ Done in 233ms

```

<br>
<br>

## 📖 Documentation

By default `ts-stub` will use `src/index.ts` as entrypoint and `dist` as your build folder.  
But everyting is configurable!

**Input and output files:**

```sh
ts-stub --input=src/foo.ts --output=build
```

**Output format:**

```sh
ts-stub --format=cjs
```

**Output format extension:**

```sh
ts-stub --format=cjs:js
```

**Custom working directory:**

```sh
ts-stub packages/foo
# same as: ts-stub --input=packages/foo/src/index.ts --output=packages/foo/dist
```

### Options

You can run `ts-stub --help` to see the following available options:

<!-- <auto:help> -->

```
Usage: ts-stub [options] [cwd_directory]

Stub your build to improve monorepo DX

Options:
  -V, --version          output the version number
  -i, --input [file]     Input typescript file path (default: "src/index.ts")
  -o, --output [dir]     Output stub directory (default: "dist")
  --noEmit               Disable emitting declaration files (default: false)
  -f, --format [format]  Output format and extension. Can be "esm", "esm:js", "cjs" and "cjs:js"
                         Default extension for "esm" and "cjs" are ".mjs" and ".cjs"
  -c, --clear            Clear output folder before stubbing (default: false)
  -q, --quiet            Prevent any output to stdout (default: false)
  --noEffects            Disable any file system mutations (default: false)
  -h, --help             display help for command

```

<!-- </auto:help> -->

<br>
<br>

## 📃 Developer API

**Single entry:**

```ts
import { stub } from "ts-stub";

stub({
  entry: {
    input: "src/index.ts",
    output: "dist",
    format: "esm",
  },
  cwd: path.join(process.cwd(), "/path/to/package"),
  quiet: false, // default false
  clear: true, // default false
  noEffects: false, // default false
});
```

**Multiple entries:**

```ts
import { stub } from "ts-stub";

stub({
  entry: [
    {
      input: "src/index.ts",
      output: "dist",
      format: "esm",
    },
    {
      input: "src/server.ts",
      output: "dist",
      format: "esm",
    },
  ],
  cwd: path.join(process.cwd(), "/path/to/package"),
  quiet: false, // default false
  clear: true, // default false
  noEffects: false, // default false
});
```

<br>
<br>

## When `unbuild --stub` and when `ts-stub`

The first time I saw the concept was in [Anthony Fu's post](https://antfu.me/posts/publish-esm-and-cjs) and _ts-stub_ was largely inspired by it.  
If you don't know _unbuild_ yet: it is a rollup-based package bundler made by the folks of unjs.  
They also do build stubbing with the <kbd>--stub</kbd> flag.

<br>

### Reasons to prefer _unbuild --stub_

**1. Convenience**

> If you already use _unbuild_ to bundle your packages, there is **absolutely no reason** for you to use _ts-stub_.  
> Just go with _unbuild --stub_!

**2. ESM**

> _ts-stub_ is designed to typescript only.  
> If you just bundle esm code and still need stubbing (may be there better alternatives tho) just go with _unbuild --stub_

<br>

### Reasons to prefer _ts-build_

**1. Lighter**

> _unbuild_ is a complete bundler, it's heavier because their scope is larger.  
> _ts-stub_ is an lighter alternative if you already have a bundler setup and just want stubbing.

**2. May be faster**

> _unbuild --stub_ is powered by `jiti` (that uses `babel`) for runtime and `rullup` with plugins for the esm exports bundle.  
> _ts-stub_ is powered by `tsx` (that uses `esbuild`) for runtime and _static analysis_ for the esm exports bundle
