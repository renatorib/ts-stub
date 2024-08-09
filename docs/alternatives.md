# You may not need stubbing

There's some alternatives that can match your expectations without the need to stubbing your build

## TypeScript

### Conditions solution

You can use node **conditional exports** to point your main to your source file in development.

```json
{
  "name": "b",
  "exports": {
    "development": "./src/index.ts",
    "default": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

While it work, you still need to enable typescript runtime though a loader (like ts-node, tsx, jiti, etc.), since node cannot handle typescript native _yet_.
You will also need to pass `--conditions=development` flag when running it.

```bash
tsx --conditions=development packages/a/index.ts
```

### Alternate package.json

You can make two different `package.json` for local and published, so you can change your exports accordingly.

Local:

```json
{
  "name": "b",
  "exports": "./src/index.ts"
}
```

Generate for publishing:

```json
{
  "name": "b",
  "exports": {
    "import": "./dist/index.mjs",
    "require": "./dist/index.js"
  }
}
```

You will still need a typescript runtime loader, but will not need conditions flag this time

```bash
tsx packages/a/index.ts
```

### Stick to watch & rebuild

If you don't mind some delaying, you could still stick to _watch & rebuild_ technique

## ESM

TODO
