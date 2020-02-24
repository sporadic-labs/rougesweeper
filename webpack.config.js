/* eslint-env node */

const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

module.exports = function(env, argv) {
  const isDev = argv.mode === "development";

  return {
    mode: isDev ? "development" : "production",
    context: path.resolve(__dirname, "src"),
    entry: "./js/main.ts",
    cache: true,
    output: {
      path: path.resolve(__dirname, "public"),
      filename: "main.js"
    },
    module: {
      rules: [
        { test: /\.(ts|tsx)$/, use: "ts-loader", exclude: /node_modules/ },

        { test: /\.(js|jsx)$/, use: "babel-loader", exclude: /node_modules/ },

        {
          test: /\.(scss|sass)$/,
          use: [
            isDev ? { loader: "style-loader" } : MiniCssExtractPlugin.loader,
            { loader: "css-loader", options: { sourceMap: true } },
            { loader: "sass-loader", options: { sourceMap: true } }
          ]
        },

        {
          test: /\.(eot|svg|ttf|woff|woff2|png|jpg)$/,
          use: {
            loader: "file-loader",
            options: {
              name: "[path][name].[ext]"
            }
          }
        },

        // Allow shaders to be loaded via glslify
        { test: /\.(glsl|frag|vert)$/, use: ["raw-loader", "glslify"] }
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"]
    },
    plugins: [
      new HTMLWebpackPlugin({ template: "./index.html" }),

      new MiniCssExtractPlugin({
        filename: "[name].[hash].css",
        chunkFilename: "[id].[hash].css"
      }),

      // Instead of using imports & file loader for Phaser assets, just copy over all resources
      new CopyWebpackPlugin([
        {
          from: "./resources",
          to: "resources/",
          ignore: ["atlases/assets/**/*", "**/*.tps"]
        }
      ]),

      new webpack.DefinePlugin({
        "typeof CANVAS_RENDERER": JSON.stringify(true),
        "typeof WEBGL_RENDERER": JSON.stringify(true),
        IS_PRODUCTION: JSON.stringify(!isDev),
        IS_DEVELOPMENT: JSON.stringify(isDev)
      })
    ],
    devtool: isDev ? "eval-source-map" : "source-map"
  };
};
