const webpack = require("webpack");
const path = require("path");

const phaserPath = path.join(__dirname, '/node_modules/phaser-ce/');


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
      alias: {
        "p2": path.join(phaserPath, 'build/custom/p2.js'),
        "pixi": path.join(phaserPath, 'build/custom/pixi.js'),
        "phaser-ce": path.join(phaserPath, 'build/custom/phaser-split.js'),
      }
  },

  devtool: "source-map",

  module: {
    rules: [
        { test: /\.css$/, use: ["style-loader!css-loader"] },
        { test: /\.tsx?$/, use: ["awesome-typescript-loader"] },
        { test: /phaser-split\.js$/, use: [{loader: "expose-loader", options: "Phaser"}] },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({ PIXI: "pixi", p2: "p2" }),
  ]
};
