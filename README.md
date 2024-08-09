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

###### The "watch & rebuild" problem

When working with workspaces _(ie multiple packages in a repository)_ even though you link a package from your local file system, the module resolution still depends on your `package.json` exports/main which usually points to the code's **bundled directory** _(eg `dist/`, `build/`, `lib/`, etc)_.

This way you still need the source code to be bundled so that some other package can consume it, even locally. The most common way to get around this inconvenience is with _watch & rebuild_, triggering the build when some source file changes. You will need a background process to watch the file changes and might experience some delay to changes be applied _(including the types that depends on build .d.ts)_

###### The stubbing solution

The ideia is to create a different build output on development that works like a **bridge** between your `package.json` exports/main resolution and your source file.  
See the explained diagram below:

<p align="center">

![diagram](.github/assets/diagram-dark.png#gh-dark-mode-only)
![diagram](.github/assets/diagram-light.png#gh-light-mode-only)

</p>

---

## 🧑‍💻 Getting started

> [!NOTE]  
> `ts-stub` is made to be used in workspaces/multi-package repos (aka monorepos).  
> Otherwise it will **not** bring any benefit, unless you do manual symlinks through your local repos.

_**TL;DR:** Add `{ "stub": "ts-stub --clear" }` script to all pacakges and execute all at once._

---

### `1` Install `ts-stub` with your package manager

```
pnpm add -D ts-stub
# npm install --save-dev ts-stub
```

---

### `2` Add a separate build script to stubbing your pacakges

> [!TIP]  
> I recommend setting up a `prepack` or `prepublishOnly` build script to prevent publishing the stubbed build mistakenly

`packages/a/package.json`

```diff
{
  "name": "package-a",
  "scripts": {
    "build": "tsup",
+   "stub": "ts-stub --clear",
+   "prepack": "npm build"
  }
}
```

`packages/b/package.json`

```diff
{
  "name": "package-b",
  "scripts": {
    "build": "tsup",
+   "stub": "ts-stub --clear",
+   "prepack": "npm build"
  }
}
```

---

### `3` Stub all at once

Use your favorite tool to execute all packages stub script (like `pnpm -r`, `turbo`, `lerna`, `nx`, etc.)

```sh
pnpm -r stub
```

```bash
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

## 📖 Documentation

By default `ts-stub` will use `src/index.ts` as entrypoint and `dist` as your build folder.  
But everyting is configurable!

**Input and output files**

```sh
ts-stub --input=src/foo.ts --output=build
```

**Output format**

```sh
ts-stub --format=cjs
```

**Output format extension**

```sh
ts-stub --format=cjs:js
```

**Custom working directory**

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

## 📃 Developer API

**Single entry**

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

**Multiple entries**

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

## When `ts-stub` and `unbuild --stub`

First of all: `unbuild` is amazing!  
The first time I saw the concept was in [Anthony Fu's post](https://antfu.me/posts/publish-esm-and-cjs) and `ts-stub` was largely inspired by it.
If you don't know `unbuild` yet: it is an package bundler based on rollup made by the folks of unjs.

### Reasons to prefer `unbuild --stub`

**`1` convenience**

If you already use `unbuild` to bundle your pacakges, there is **absolutely no reason** for you to use `ts-stub`.  
Just go with `unbuild --stub`!

**`2` esm**

`ts-stub` is designed to typescript only. If you just bundle esm code and still need stubbing (there's better alternatives tho) just go with `unbuild --stub`

### Reasons to prefer `ts-build`

**`1` lighter**

`unbuild` is a complete bundler, it's heavier because their scope is larger.  
`ts-stub` is an lighter alternative if you already have a bundler setup and just want stubbing.

**`2` may be faster**

> `unbuild --stub` is powered by `jiti` (that uses `babel`) for runtime and `rullup` with plugins for the esm exports bundle
> `ts-stub` is powered by `tsx` (that uses `esbuild`) for runtime and static analysis for the esm exports bundle
