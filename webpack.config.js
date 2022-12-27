const path = require("path");
const webpack = require("webpack");
const packageDotJSON = require("./package.json");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    index: "./src/index.ts",
    cli: "./src/cli/index.ts",
    db_subprocess: "./src/data-access/db/subprocess-db.js",
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
      test: /cli/,
      banner: "#!/usr/bin/env node",
    }),
    new webpack.DefinePlugin({
      __APP_VERSION__: JSON.stringify(packageDotJSON.version),
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
