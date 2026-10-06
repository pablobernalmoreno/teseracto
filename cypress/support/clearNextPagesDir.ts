// Cypress's Next integration passes `pagesDir = projectRoot` to Next's SWC loader whenever there
// is no `pages/` folder, which is the case for an app-router-only project like this one. The loader
// then treats every file under the project root, node_modules included, as a Next "page" and
// rejects `export *` in MUI's index files. Clearing `pagesDir` makes nothing a page, which is
// right: component tests mount components, not routes. Test configuration only; the app's own
// build is untouched.

// Only the parts of webpack's rule shape this needs, so webpack itself is not a dependency here.
interface LoaderUse {
  loader?: string;
  options?: unknown;
}
interface Rule extends LoaderUse {
  oneOf?: (Rule | "...")[];
  rules?: (Rule | "...")[];
  use?: LoaderUse | string | (LoaderUse | string)[];
}
interface CompilerLike {
  options: { module?: { rules?: (Rule | "...")[] } };
}

function withoutPagesDir(options: unknown): unknown {
  return { ...(options as object), pagesDir: undefined };
}

function clearPagesDir(rules: (Rule | "...")[]) {
  for (const rule of rules) {
    if (rule === "...") continue;

    if (rule.oneOf) clearPagesDir(rule.oneOf);
    if (rule.rules) clearPagesDir(rule.rules);

    const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
    for (const use of uses) {
      if (typeof use === "object" && use.loader?.includes("next-swc-loader") && use.options) {
        use.options = withoutPagesDir(use.options);
      }
    }

    if (rule.loader?.includes("next-swc-loader") && rule.options) {
      rule.options = withoutPagesDir(rule.options);
    }
  }
}

export class ClearNextPagesDirPlugin {
  apply(compiler: CompilerLike) {
    clearPagesDir(compiler.options.module?.rules ?? []);
  }
}
