import fs from "fs";
import ts from "typescript";
import { resolve } from "./resolve.js";

export function extractExportsIdentifiers(entry: string | URL) {
  const ANONYMOUS_NAME = "_default";

  const file = ts.createSourceFile(
    "x.ts",
    (entry instanceof URL ? fs.readFileSync(entry, "utf8") : entry) ?? "",
    ts.ScriptTarget.Latest,
    true,
  );

  // Cases where an identifier are both default and named are valid (and common)
  // e.g: export const foo = "bar"
  //      export default foo
  // The example file should be extracted as following:
  // `Map(1) {"foo" => { isDefault: true, isNamed: true }}`
  const identifiers = new Map<string, { default?: boolean; named?: boolean }>();
  const add = (name: string, meta: ReturnType<typeof identifiers.get> = {}) =>
    identifiers.set(name, { ...identifiers.get(name), ...meta });

  function recursiveExtract(node: ts.Node) {
    // Extract default export from ExportAssignment
    // e.g: export default foo
    //      export default "foo"
    //      export default () => {}
    if (ts.isExportAssignment(node)) {
      const name = ts.isIdentifier(node.expression)
        ? // ExportAssignment with an Identifier
          // e.g: export default foo
          //                     ^ this is an Identifier
          node.expression.getText()
        : // Any export assignment without an Identifier must be treated as anonymous export
          // e.g: export default () => "foo"
          //                     ^ this an ArrowFunction
          //                       arrow functions is an expression and do not have identifier/name
          //      export default "foo"
          //                     ^ this is a Literal (StringLiteral in this case but could be NumericLiteral etc)
          //                       literals do not have identifier/name
          //      and so on...
          ANONYMOUS_NAME;

      add(name, { default: true });
    }

    // Extract named exports from ExportSpecifier ()
    // e.g: export { foo, bar }
    //               ^^^ `foo` is an ExportSpecifier
    //      export { bar, baz }
    //             ^^^^^^^^^^^^ { bar, baz } is an NamedExports
    //      export { foo, bar }
    //      ^^^^^^^^^^^^^^^^^^^ export { foo, bar } is an ExportDeclaration
    if (
      ts.isExportSpecifier(node) &&
      // Ignore explicit `type` from ExportSpecifier
      // e.g: export { type foo }
      //               ^^^^
      node.isTypeOnly === false &&
      // Ignore explicit `type` exports from ExportDeclaration
      // e.g: export type { foo, bar }
      //             ^^^^
      node.parent.parent.isTypeOnly === false
    ) {
      add(node.name.getText(), { named: true });
    }

    // Extract exports from reexporting another module
    // e.g: export * from "./foo"
    if (
      ts.isExportDeclaration(node) &&
      node.getChildren().some(isAsteriskToken) &&
      node.moduleSpecifier
    ) {
      // Unsupported when calling with code string as entry
      if (typeof entry === "string") {
        return;
      }

      // Extract exports from the module and merge it to the current
      try {
        const moduleUrl = resolve(JSON.parse(node.moduleSpecifier.getText()), entry);
        const moduleIds = extractExportsIdentifiers(moduleUrl);
        for (const [name, meta] of moduleIds.entries()) {
          identifiers.set(name, meta);
        }
      } catch (e) {
        console.warn(`"${node.getFullStart()}" could not be followed: ${e}`);
      }
    }

    // Extract exports from ExportKeyword's parent.
    // > There's some normal Declaration/Statemente nodes that contains `export` modifier.
    // > Here we will search for any ExportKeyword token then work with its parent.
    //
    // e.g: export function foo()             // -> FunctionDeclaration
    //  ⁽*⁾ export default function foo() {}  // -> FunctionDeclaration (with default modifier)
    //      export class Bar()                // -> ClassDeclaration
    //  ⁽*⁾ export default class Baz {}       // -> ClassDeclaration (with default modifier)
    //      export const foo = "bar"          // -> VariableStatement
    //
    // Note⁽*⁾: Not all `export default` syntax is treated as ExportAssigment node, e.g:
    //
    //          export default foo
    //          └─ ExportAssigment
    //             └─ Identifier       (foo)
    //
    //          export default function foo() {}
    //          └─ FunctionDeclaration
    //             ├─ ExportKeyword    (export)
    //             ├─ DefaultKeyword   (default)
    //             ├─ Identifier       (foo)
    //             └─ Block            ({})
    //
    if (isExportKeyword(node)) {
      const parent = node.parent;
      const hasDeclareModifier =
        ts.canHaveModifiers(parent) && parent.modifiers?.some(isDeclareKeyword);
      const hasDefaultModifier =
        ts.canHaveModifiers(parent) && parent.modifiers?.some(isDefaultKeyword);

      // from VariableStatement
      // e.g: export const foo = 'foo'
      //      export const bar = 'bar', baz = 'baz'
      if (ts.isVariableStatement(parent) && !hasDeclareModifier) {
        parent.declarationList.declarations.forEach((declaration) => {
          add(declaration.name.getText(), { named: true });
        });
      }

      // from DeclarationStatement
      // e.g: export function foo() {}
      //      export class Bar {}
      if (
        ts.isDeclarationStatement(parent) &&
        // Ignore interfaces & types since it do not output runtime code
        // e.g.: export interface Foo {}
        //       export type foo = {}
        !ts.isInterfaceDeclaration(parent) &&
        !ts.isTypeAliasDeclaration(parent) &&
        // Ignore declare modifier since it do not output runtime code
        // e.g.: export declare const foo: string
        //       export declare function Foo(): any
        !hasDeclareModifier
      ) {
        if (parent.name && ts.isIdentifier(parent.name)) {
          // This declaration *has* a name identifier
          // This can be named or default depending on default modifier
          // e.g: export (default?) function foo()
          //      export (default?) class Bar {}
          add(parent.name.getText(), hasDefaultModifier ? { default: true } : { named: true });
        } else {
          // This declaration *do not has* a name identifier
          // This can only be default export
          // e.g: export default function() // -> OK
          //      export default class {}   // -> OK
          //
          //      export class {}
          //      ^^^^^^ -------------> A class declaration without the 'default'
          //                             modifier must have a name.(1211)
          //      export function() {}
          //                    ^^ ---> Identifier expected.(1003)
          if (hasDefaultModifier) {
            add(ANONYMOUS_NAME, { default: true });
          }
        }
      }
    }

    // Recursively visit children nodes
    node.forEachChild(recursiveExtract);
  }

  recursiveExtract(file);
  return identifiers;
}

function isExportKeyword(node: ts.Node): node is ts.ExportKeyword {
  return node.kind === ts.SyntaxKind.ExportKeyword;
}

function isDefaultKeyword(node: ts.Node): node is ts.DefaultKeyword {
  return node.kind === ts.SyntaxKind.DefaultKeyword;
}

function isDeclareKeyword(node: ts.Node): node is ts.DeclareKeyword {
  return node.kind === ts.SyntaxKind.DeclareKeyword;
}

function isAsteriskToken(node: ts.Node): node is ts.AsteriskToken {
  return node.kind === ts.SyntaxKind.AsteriskToken;
}
