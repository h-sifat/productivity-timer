const path = require("path");
const webpack = require("webpack");
const packageDotJSON = require("./package.json");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const outputModuleNames = {
  CLI: "cli",
  SERVER: "server",
  DB_SUBPROCESS: "db_subprocess",
};

module.exports = {
  mode: "production",
  entry: {
    [outputModuleNames.SERVER]: "./src/index.ts",
    [outputModuleNames.CLI]: "./src/cli/index.ts",
    [outputModuleNames.DB_SUBPROCESS]: "./src/data-access/db/subprocess-db.js",
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    plugins: [new TsconfigPathsPlugin()],
  },

  plugins: [
    new webpack.BannerPlugin({
      raw: true,
      banner: "#!/usr/bin/env node",
      test: new RegExp(outputModuleNames.CLI),
    }),
    new webpack.DefinePlugin({
      __APP_VERSION__: JSON.stringify(packageDotJSON.version),
      __M_PLAYER_AUDIO_FILE_NAME__: JSON.stringify("alarm.mp3"),
      __DB_SUBPROCESS_FILE_NAME__: JSON.stringify(
        outputModuleNames.DB_SUBPROCESS + ".js"
      ),
      __SERVER_FILE_NAME__: JSON.stringify(outputModuleNames.SERVER + ".js"),
      __CLI_FILE_NAME__: JSON.stringify(outputModuleNames.CLI + ".js"),
    }),
  ],

  externalsType: "commonjs",
  externals: Object.keys(packageDotJSON.dependencies).reduce(
    (externals, packageName) => {
      externals[packageName] = packageName;
      return externals;
    },
    {}
  ),

  node: {
    __dirname: false,
    __filename: false,
  },

  externalsPresets: {
    node: true,
  },

  output: {
    clean: true,
    globalObject: "this",
    filename: "[name].js",
    library: { type: "commonjs" },
    path: path.resolve(__dirname, "dist"),
  },
};
