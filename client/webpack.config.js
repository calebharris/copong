const webpack = require("webpack");
const path = require("path");

module.exports = {
  entry: {
    app: "./src/index.ts"
  },
  output: {
      filename: "[name].bundle.js",
      library: "copongApp",
      path: __dirname + "/dist",
      publicPath: "/assets/"
  },
  resolve: {
      extensions: [".ts", ".js"],
  },

  devtool: "source-map",

  module: {
    rules: [
        { test: /\.css$/, use: ["style-loader!css-loader"] },
        { test: /\.tsx?$/, use: ["awesome-typescript-loader"] },
    ],
  },
};
