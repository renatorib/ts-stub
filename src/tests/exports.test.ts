import { expect, test } from "vitest";
import { extractExportsIdentifiers } from "../exports.js";

const map = (object: object) => new Map(Object.entries(object));

test("extract exports", () => {
  expect(
    extractExportsIdentifiers(new URL("file://" + process.cwd() + "/src/tests/entry/index.ts")),
  ).toEqual(
    map({
      bar: { named: true },
      bar2: { named: true },
      bar3: { named: true },
      Foo: { named: true },
      Bar: { named: true },
      foo: { default: true, named: true },
    }),
  );
});

test("extract exports star", () => {
  expect(
    extractExportsIdentifiers(new URL("file://" + process.cwd() + "/src/tests/entry/src/index.ts")),
  ).toEqual(
    map({
      bar: { named: true },
      bar2: { named: true },
      bar3: { named: true },
      Foo: { named: true },
      Bar: { named: true },
      foo: { default: true, named: true },
    }),
  );
});

test("extract anonymous", () => {
  expect(extractExportsIdentifiers("export default 1")).toEqual(
    map({ _default: { default: true } }),
  );

  expect(extractExportsIdentifiers(`export default "foo"`)).toEqual(
    map({ _default: { default: true } }),
  );

  expect(extractExportsIdentifiers("export default () => {}")).toEqual(
    map({ _default: { default: true } }),
  );

  expect(extractExportsIdentifiers("export default function() {}")).toEqual(
    map({ _default: { default: true } }),
  );
});

test("extract default export declarations", () => {
  expect(extractExportsIdentifiers(`export default function foo() {}`)).toEqual(
    map({ foo: { default: true } }),
  );

  expect(extractExportsIdentifiers(`export default class Bar {}`)).toEqual(
    map({ Bar: { default: true } }),
  );
});

test("ignore declare", () => {
  expect(
    extractExportsIdentifiers(`
    export declare class Bar {};
    export declare function foo(): void;
    export declare const bar: string;
  `),
  ).toEqual(map({}));
});
