const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    index: "./src/index.ts",
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

  externalsType: "commonjs",
  externals: {
    "express-ipc": "express-ipc",
    "handy-types": "handy-types",
    "node-notifier": "node-notifier",
    "better-sqlite3": "better-sqlite3",
  },

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
