/* eslint-env node */

const CopyWebpackPlugin = require("copy-webpack-plugin")
const path = require("path")
const webpack = require("webpack")
const root = __dirname

module.exports = function (env, argv) {
  const isDev = argv.mode === "development"

  return {
    mode: isDev ? "development" : "production",
    context: path.join(root, "src"),
    entry: {
      "01_navmesh/js/main": "./01_navmesh/js/main.js",
      "02_tiled_and_player/js/main": "./02_tiled_and_player/js/main.js",
    },
    output: {
      filename: "[name].js",
      path: path.resolve(root, "public"),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          // Exclude phaser-navmesh here when in a monorepo, because the resolved path isn't through
          // node_modules. In a project outside of the monorepo, you shouldn't need this.
          exclude: /node_modules|phaser-navmesh/,
          // Configure babel to look for the root babel.config.json with rootMode.
          // use: { loader: "babel-loader", options: { rootMode: "upward" } },
          use: { loader: "babel-loader" },
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [{ from: "**/*", globOptions: { ignore: ["**/js/**/*"] } }],
      }),

      new webpack.DefinePlugin({
        "typeof CANVAS_RENDERER": JSON.stringify(true),
        "typeof WEBGL_RENDERER": JSON.stringify(true),
        PRODUCTION: !isDev,
      }),
    ],
    devtool: isDev ? "eval-source-map" : "source-map",
  }
}
