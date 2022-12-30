// I had no choice but to do this hack. Webpack is converting
// my dynamic `await import("module")` calls to require. And this is throwing
// error because the boxen library I'm using is an es-module package.
export async function dynamicImport(module: string) {
  return eval(`import("${module}")`);
}
