const esbuild = require("esbuild");
const colors = require("ansi-colors");
const humanFormat = require("human-format");
const packageDotJSON = require("./package.json");

/*
 * This plugin is  needed because right now, esbuild can't resolve typescript
 * path aliases with the `packages: "external"` config.
 * */
const makePackagesExternalPlugin = {
  name: "external-modules",
  setup(build) {
    build.onResolve({ filter: /.*$/ }, async (args) => {
      if (!args.pluginData?.resolved) {
        const resolveResult = await build.resolve(args.path, {
          kind: "import-statement",
          resolveDir: args.resolveDir,
          pluginData: { resolved: true },
        });
        if (resolveResult.path.includes("/node_modules/")) {
          return { path: args.path, external: true, sideEffects: false };
        }
        return resolveResult;
      }
    });
  },
};

const outputModuleNames = Object.freeze({
  CLI: "cli",
  TUI: "tui",
  SERVER: "server",
  DB_SUBPROCESS: "db_subprocess",
});

const BUILD_MODE =
  process.env.BUILD_MODE === "production" ? "production" : "development";

const globalConstants = {
  __APP_VERSION__: packageDotJSON.version,
  __M_PLAYER_AUDIO_FILE_NAME__: "alarm.mp3",
  __CLI_FILE_NAME__: outputModuleNames.CLI + ".js",
  __SERVER_FILE_NAME__: outputModuleNames.SERVER + ".js",
  __DB_SUBPROCESS_FILE_NAME__: outputModuleNames.DB_SUBPROCESS + ".js",
  __BUILD_MODE__: BUILD_MODE,
};

for (const key in globalConstants)
  globalConstants[key] = JSON.stringify(globalConstants[key]);

const esbuildConfig = {
  entryPoints: [
    { in: "src/index.ts", out: outputModuleNames.SERVER },
    { in: "src/tui/index.ts", out: outputModuleNames.TUI },
    { in: "src/cli/index.ts", out: outputModuleNames.CLI },
    {
      in: "src/data-access/db/subprocess-db.js",
      out: outputModuleNames.DB_SUBPROCESS,
    },
  ],

  define: globalConstants,

  outdir: "dist",
  platform: "node",
  minify: true,
  bundle: true,

  loader: { ".md": "text" },

  treeShaking: true,
  target: ["esnext", "node14"],

  plugins: [makePackagesExternalPlugin],

  metafile: true,
};

async function build() {
  const result = await esbuild.build(esbuildConfig, { metafile: true });

  const logs = [];

  let maxFileNameLength = 0;
  for (const [outputFileName, { bytes }] of Object.entries(
    result.metafile.outputs
  )) {
    logs.push({ name: outputFileName, size: humanFormat(bytes) });
    maxFileNameLength = Math.max(maxFileNameLength, outputFileName.length);
  }

  for (const { name, size } of logs)
    console.log(name.padEnd(maxFileNameLength + 5), size);
}

async function buildWatch() {
  const ctx = await esbuild.context(esbuildConfig);

  await ctx.watch();
  console.log("watching...");

  process.on("SIGINT", async () => {
    await ctx.dispose();
    console.log("stopped watching.");
    process.exit();
  });
}

console.log(
  colors.greenBright(
    `------------------[BUILD: ${BUILD_MODE}]---------------------`
  )
);
if (process.argv.includes("--watch")) buildWatch();
else build();
