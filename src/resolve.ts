import { moduleResolve, ErrnoException } from "import-meta-resolve";

class ModuleNotFoundError extends Error {
  name = "ModuleNotFoundError";
  constructor(url?: string) {
    super(`Module not found: ${url}`);
  }
}

export function resolve(specifier: string, parent: URL) {
  let resolved: ModuleNotFoundError | URL | undefined;
  let suffix = ["", ".ts", "/index.ts"];

  while (!(resolved instanceof URL) && suffix.length > 0) {
    resolved = tryResolve(specifier.replace(/\.js$/, "") + suffix.shift()!, parent);
  }

  if (resolved instanceof ModuleNotFoundError) {
    throw resolved;
  }

  return resolved as URL;
}

function tryResolve(specifier: string, parent: URL) {
  try {
    return moduleResolve(specifier, parent, new Set(["node", "import"]));
  } catch (exception) {
    if (exception instanceof Error && "code" in exception) {
      const error = exception as ErrnoException;
      if (
        [
          "ERR_MODULE_NOT_FOUND",
          "ERR_UNSUPPORTED_DIR_IMPORT",
          "MODULE_NOT_FOUND",
          "ERR_PACKAGE_PATH_NOT_EXPORTED",
        ].includes(error.code ?? "")
      ) {
        return new ModuleNotFoundError(error.url);
      }
    }

    throw exception;
  }
}
